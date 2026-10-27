"""Regression tests for the shared Conductor configuration contract."""

from pathlib import Path
from tempfile import TemporaryDirectory
import subprocess
import unittest

from check_conductor_settings import (
    PROMPTS,
    SCRIPTS,
    check_index,
    check_repository,
    validate_settings,
)


ROOT = Path(__file__).resolve().parents[1]


class ConductorSettingsTests(unittest.TestCase):
    def settings(self):
        return {"scripts": dict(SCRIPTS), "prompts": dict.fromkeys(PROMPTS, "Guidance")}

    def test_committed_settings_preserve_the_lifecycle_contract(self):
        check_repository(ROOT)
        check_index(ROOT)

    def test_missing_replacement_configuration_is_rejected(self):
        with TemporaryDirectory() as directory:
            with self.assertRaisesRegex(ValueError, "is missing"):
                check_repository(Path(directory))

    def test_untracked_replacement_configuration_is_rejected(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            subprocess.run(["git", "init", "--quiet", directory], check=True)
            (root / ".conductor").mkdir()
            (root / ".conductor/settings.toml").write_bytes(
                (ROOT / ".conductor/settings.toml").read_bytes()
            )
            with self.assertRaises(subprocess.CalledProcessError):
                check_index(root)

    def test_wrong_commands_modes_and_missing_scripts_are_rejected(self):
        for key, value in [("run_mode", "nonconcurrent"), ("run", {}), ("setup", "bash missing.sh")]:
            settings = self.settings()
            settings["scripts"][key] = value
            with self.assertRaises(ValueError):
                validate_settings(settings)
        settings = self.settings()
        del settings["scripts"]["setup"]
        with self.assertRaises(ValueError):
            validate_settings(settings)

    def test_force_added_machine_local_settings_are_rejected(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            subprocess.run(["git", "init", "--quiet", directory], check=True)
            (root / ".conductor").mkdir()
            (root / ".gitignore").write_text(".conductor/settings.local.toml\n")
            for filename in ["settings.toml", "settings.local.toml"]:
                (root / ".conductor" / filename).write_text("# fixture\n")
            subprocess.run(["git", "-C", directory, "add", ".conductor/settings.toml"], check=True)
            check_index(root)
            subprocess.run(
                ["git", "-C", directory, "add", "--force", ".conductor/settings.local.toml"],
                check=True,
            )
            with self.assertRaisesRegex(ValueError, "must not be tracked"):
                check_index(root)

    def test_legacy_prompt_names_and_empty_prompts_are_rejected(self):
        settings = self.settings()
        settings["prompts"]["codeReview"] = settings["prompts"].pop("code_review")
        with self.assertRaises(ValueError):
            validate_settings(settings)
        for value in ["", " ", None, []]:
            settings = self.settings()
            settings["prompts"]["general"] = value
            with self.assertRaises(ValueError):
                validate_settings(settings)

    def test_legacy_json_cannot_silently_override_the_new_configuration(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            (root / ".conductor").mkdir()
            (root / ".conductor/settings.toml").write_bytes((ROOT / ".conductor/settings.toml").read_bytes())
            (root / "conductor.json").write_text("{}")
            with self.assertRaisesRegex(ValueError, "must not coexist"):
                check_repository(root)

    def test_missing_lifecycle_entrypoints_are_rejected(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            (root / ".conductor").mkdir()
            (root / ".conductor/settings.toml").write_bytes((ROOT / ".conductor/settings.toml").read_bytes())
            with self.assertRaisesRegex(ValueError, "script is missing"):
                check_repository(root)


if __name__ == "__main__":
    unittest.main()
