# Supportable Agent Model

## Overview

Supportable treats artificial intelligence agents as participants within the ecosystem.

An agent is not merely a tool. An agent is a participant capable of fulfilling roles, participating in sessions, creating solutions, evaluating evidence, and contributing to shared knowledge.

Agents operate alongside humans through defined capabilities, permissions, responsibilities, and evidence histories.

---

# Agent as Participant

An Agent is a specialized type of Participant.

```text
Participant

├── Human

├── Agent

└── Organization
```

Agents have:

* Identity
* Purpose
* Capabilities
* Permissions
* Limitations
* History
* Reputation

---

# Agent Roles

Agents may fulfill the same roles as humans.

Examples:

```text
Role              Human       Agent

Client              ✓           ✓

Supporter           ✓           ✓

Tester              ✓           ✓

Reviewer            ✓           ✓

Developer           ✓           ✓

Mentor              ✓           ✓

Administrator       ✓           ✓
```

The role determines behavior and permissions within a context.

---

# Agent Capabilities

Agents should explicitly declare capabilities.

Example:

```text
Agent:

SupportAgent-v1

Capabilities:

✓ Answer common questions
✓ Search knowledge
✓ Suggest solutions
✓ Create documentation drafts

Limitations:

✗ Cannot approve production changes
✗ Cannot modify protected data
```

Capabilities should be discoverable before participation.

---

# Agent Permissions

Capability does not automatically grant authority.

An agent may be capable of an action but not authorized to perform it.

Example:

```text
Capability:

Run database analysis


Permission:

Read-only production access
```

The system should separate:

* What an agent can do
* What an agent is allowed to do

---

# Agent Sessions

Agents participate through sessions.

Example:

```text
Session:

Troubleshoot printer issue


Participants:

Maria
Role:
Client


SupportAgent-v1
Role:
Supporter


Human Expert
Role:
Escalation Supporter
```

Agents may:

* Ask questions
* Suggest solutions
* Execute approved actions
* Record evidence
* Escalate to humans

---

# Human Oversight

Agents should preserve human agency.

Agents assist with:

* Clarifying intent
* Finding possibilities
* Organizing information
* Performing approved actions

Humans remain responsible for:

* Final intent
* Values and preferences
* Important decisions
* Authorization

---

# Agent Reputation

Agent reputation should be evidence-based.

A single rating is insufficient.

Example:

```text
Agent:

DatabaseAdvisor-v2


Evidence:

10,000 recommendations

Accuracy:
96%

Successful outcomes:
8,900

Escalations:
12%

Last evaluation:
2026-08-07
```

Possible reputation dimensions:

* Accuracy
* Reliability
* Safety
* Appropriate escalation
* Communication quality
* Task completion

---

# Agent Evolution

Agents themselves may evolve through the Supportable change model.

Example:

```text
Agent Version:

SupportAgent-v1

        |
        |
   Change Proposal

        |
        |
Review + Testing

        |
        |
SupportAgent-v2
```

Agent improvements should preserve:

* Previous versions
* Training sources
* Evaluation results
* Change history

---

# Agent Transparency

An agent should be able to answer:

```text
Who are you?

What role are you fulfilling?

What can you do?

What are you allowed to do?

What evidence supports your reliability?

When should you ask for help?
```

---

# Design Principle

Supportable follows this principle:

> Agents are participants whose contributions are evaluated through the same relationship, evidence, and trust systems as other participants.

Humans and agents collaborate through shared structures while maintaining clear identity, responsibility, and accountability.
