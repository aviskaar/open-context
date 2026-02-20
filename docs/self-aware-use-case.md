# Use Case: Testing the Self-Aware Context Engine

This document walks through a practical use case for testing the **Self-Aware Context Engine**. The goal is to observe the system autonomously identify a knowledge gap, propose a solution, and (with user approval) act on it to improve the context store.

### Objective

To simulate agents repeatedly failing to find necessary information and watch the system detect this pattern and create a "gap-filling" placeholder context entry.

### Prerequisites

- The OpenContext server must be running.
- You have access to the web UI.

---

### Step 1: Create a Knowledge Gap

The first step is to simulate a pattern of behavior that the self-aware engine can detect. We will do this by repeatedly asking for context that does not exist. Each time `recall_context` fails to find an entry, the `Observer` logs it as a `query_miss`.

From the **Start Chat** page in the UI, execute the following command at least **three times**:

```bash
> recall_context "how to set up CI/CD pipeline"
```

Each time, the system will respond that no context was found.

```
No context found for query: "how to set up CI/CD pipeline"
```

**Behind the Scenes:** With each failure, a `query_miss` event is logged to the `awareness.json` file. The engine is configured to identify three or more misses for the same query as a significant knowledge gap.

### Step 2: Trigger the Self-Improvement Analysis

The self-improvement engine runs on an automated timer in the background. By default, this "tick" occurs every 5 minutes (configurable via the `OPENCONTEXT_TICK_INTERVAL` environment variable).

Wait for the configured interval to pass. During the next tick, the `Improver` will analyze the log of events and detect the repeated query misses.

### Step 3: Observe the Proposed Improvement

1.  Navigate to the **Awareness** page from the main menu in the UI.
2.  Once the tick has run, a new card will appear in the **Pending Actions** list.

Because creating a placeholder is a **low-risk** action, your system configuration might auto-approve it. If so, you will see it in the **Recent Improvements** list instead.

If it requires approval, the pending action card will look like this:

> **[LOW]** Create 1 stub entry(ies) for repeatedly-missed queries
>
> **Reasoning:** Identified during self-improvement tick based on store analysis.
>
> [Approve] [Dismiss]

This card tells you that the system has identified a gap and is proposing a solution.

### Step 4: Approve and Verify the Result

1.  If the action is pending, click the **Approve** button on the action card.
2.  Navigate to the **Contexts** page from the main menu.
3.  You will now see a new context entry created automatically by the system. It will have content similar to this:

    > **Content:** `[GAP] Agents have searched for "how to set up CI/CD pipeline" 3 times but no context exists. Please add relevant information.`
    >
    > **Tags:** `gap`, `needs-input`
    >
    > **Source:** `self-improvement`

This new entry now serves as a placeholder, making the knowledge gap visible and actionable for a human to fill in.

---

### Conclusion

This use case demonstrates the core self-awareness loop:

1.  **Observe:** The system logged the repeated query failures.
2.  **Analyze:** The background tick identified the pattern as a knowledge gap.
3.  **Decide & Propose:** An improvement action was formulated and presented for approval.
4.  **Act:** Upon approval, the system executed the action and created a new context entry to address the gap.
