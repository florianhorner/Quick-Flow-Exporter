"""Validate the shared Conductor lifecycle contract using Python 3.11+."""

from pathlib import Path
import subprocess
import tomllib


SCRIPTS = {
    "setup": "bash scripts/conductor-setup.sh",
    "run": "bash scripts/conductor-run.sh",
    "run_mode": "concurrent",
}
PROMPTS = {"general", "code_review", "create_pr", "rename_branch"}


def validate_settings(settings):
    if set(settings) != {"scripts", "prompts"}:
        raise ValueError("Shared settings must contain scripts and prompts tables")
    if settings["scripts"] != SCRIPTS:
        raise ValueError("Conductor setup, run and concurrent mode must be preserved")
    prompts = settings["prompts"]
    if not isinstance(prompts, dict) or set(prompts) != PROMPTS:
        raise ValueError("Conductor prompt names must use the shared settings format")
    if any(not isinstance(value, str) or not value.strip() for value in prompts.values()):
        raise ValueError("Conductor prompts must be nonempty strings")


def check_repository(root):
    config = root / ".conductor/settings.toml"
    if not config.is_file():
        raise ValueError("Shared .conductor/settings.toml is missing")
    if (root / "conductor.json").exists():
        raise ValueError("Legacy conductor.json must not coexist with shared TOML settings")
    with config.open("rb") as source:
        settings = tomllib.load(source)
    validate_settings(settings)
    for command in (SCRIPTS["setup"], SCRIPTS["run"]):
        script = command.removeprefix("bash ")
        if not (root / script).is_file():
            raise ValueError(f"Configured Conductor lifecycle script is missing: {script}")
    return settings


def check_index(root):
    subprocess.run(
        ["git", "-C", str(root), "ls-files", "--error-unmatch", ".conductor/settings.toml"],
        check=True,
        capture_output=True,
    )
    local_settings = subprocess.run(
        ["git", "-C", str(root), "ls-files", "--error-unmatch", ".conductor/settings.local.toml"],
        check=False,
        capture_output=True,
    )
    if local_settings.returncode == 0:
        raise ValueError("Machine-local Conductor settings must not be tracked")
    if local_settings.returncode != 1:
        local_settings.check_returncode()
    for filename, expected in [
        (".conductor/settings.toml", 1),
        (".conductor/settings.local.toml", 0),
    ]:
        result = subprocess.run(
            ["git", "-C", str(root), "check-ignore", "--no-index", "--quiet", filename],
            check=False,
            capture_output=True,
        )
        if result.returncode != expected:
            raise ValueError("Shared settings must be publishable and local overrides ignored")


if __name__ == "__main__":
    repository = Path(__file__).resolve().parents[1]
    check_repository(repository)
    check_index(repository)
    print("Shared Conductor settings and lifecycle hooks validated")
