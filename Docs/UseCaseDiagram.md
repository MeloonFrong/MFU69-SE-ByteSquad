[INFOCENTERUseCaseDiagram_GitHub.md](https://github.com/user-attachments/files/34875057/INFOCENTERUseCaseDiagram_GitHub.md)
# Content Aggregator System – Use Case Diagram

The Mermaid diagram below recreates the original use case diagram, including the system boundary, actor associations, and `<<include>>` / `<<extend>>` relationships.

```mermaid
flowchart LR
    Actor["○<br/>│<br/>╱│╲<br/>╱ ╲<br/>Actor"]

    subgraph System["Content Aggregator System"]
        direction TB
        Add(["Add External<br/>Source"])
        Subscribe(["Subscribe to<br/>Source"])
        View(["View Aggregated<br/>Content Feed"])
        Filter(["Filter and Sort<br/>Content"])
        Categorize(["Categorize<br/>Subscriptions"])

        Add -.->|«include»| Subscribe
        Filter -.->|«extend»| View
    end

    Actor --- Subscribe
    Actor --- View
    Actor --- Filter
    Actor --- Categorize

    style Actor fill:transparent,stroke:transparent,color:#000
```
