# Supported Step Types

[&larr; Back to README](../README.md)

Quick Flow Exporter understands every step type that Amazon Quick Flows supports. Each renders with a distinct icon and color in the graph, and exports cleanly to Markdown, Mermaid, and JSON.

| Type                | Icon | Description                |
| ------------------- | ---- | -------------------------- |
| Chat Agent          | 🤖   | Conversational AI agent    |
| General Knowledge   | 🧠   | LLM-powered knowledge step |
| Web Search          | 🌐   | Internet search step       |
| UI Agent            | 🖱️   | Browser automation         |
| Create Image        | 🖼️   | Image generation           |
| Quick Suite Data    | 📊   | Internal data queries      |
| Dashboards & Topics | 📈   | BI dashboard integration   |
| Application Actions | ⚡   | External system actions    |
| User Input (Text)   | 📝   | Text input from user       |
| User Input (Files)  | 📎   | File upload from user      |

## Reasoning groups

Groups wrap a subset of steps in conditional logic (run if / run unless). Group instructions are extracted with a second AI pass when groups are detected during parsing. In the graph, groups render as subgraphs with a dashed border and a run-condition badge.

## `@references`

Steps can reference output from earlier steps using `@StepName` syntax. These render as dashed edges in the graph and are preserved verbatim in all export formats.
