# Supportable Data Model

## Overview

Supportable is built around a relationship-based model.

Rather than organizing the system around isolated applications, tickets, or users, Supportable models:

* Participants
* Roles
* Intent
* Context
* Solutions
* Evidence
* Relationships

The goal is to create a flexible foundation where humans, agents, and organizations can collaborate around meaningful outcomes.

---

# Core Entities

## Participant

A Participant is any entity capable of participating in a Supportable interaction.

Examples:

* Human
* AI Agent
* Organization
* Future autonomous system

A Participant has identity, capabilities, and a history of participation.

Conceptual model:

```text
Participant
------------
id
type
name
description
identity
capabilities
created_at
updated_at
```

Participant types:

```text
Human
Agent
Organization
```

---

# Role

A Role describes how a Participant participates within a specific context.

Roles are not permanent identities.

A Participant may fulfill many roles.

Examples:

* Client
* Supporter
* Tester
* Reviewer
* Developer
* Mentor
* Administrator

Conceptual model:

```text
Role
------------
id
name
description
permissions
```

Participant-role relationship:

```text
Participant
      |
      | fulfills
      |
      v
Role
```

---

# Intent

Intent represents the desired outcome, need, question, or direction expressed by a Participant.

Intent is the starting point of problem solving.

Examples:

* "My computer is slow"
* "I want to learn Swift"
* "I need a database design"
* "I want to automate this process"

Conceptual model:

```text
Intent
------------
id
expression
type
status
priority
created_by
created_at
```

Intent types:

```text
Question
Problem
Goal
Request
Opportunity
Exploration
```

---

# Context

Solutions require context.

The same intent may require different solutions depending on circumstances.

Examples:

* Available resources
* Environment
* Constraints
* Preferences
* History
* Requirements

Conceptual model:

```text
Context
------------
id
type
properties
created_at
```

Context is intentionally flexible.

---

# Solution

A Solution is anything that may address an Intent.

Examples:

* Program
* Script
* Process
* Document
* Procedure
* Tutorial
* Service
* Agent

Conceptual model:

```text
Solution
------------
id
name
description
type
version
created_by
status
created_at
updated_at
```

Solution types:

```text
Software
Script
Process
Document
Workflow
Service
Agent
Human Expertise
```

---

# Evidence

Evidence describes how well a Solution addresses an Intent.

Evidence is the foundation for trust and reputation.

Examples:

* Successful completion
* Test results
* Reviews
* Ratings
* Usage statistics
* Validation

Conceptual model:

```text
Evidence
------------
id
solution_id
intent_id
participant_id
result
rating
comments
created_at
```

---

# Session

A Session represents an interaction between Participants.

Examples:

* Support session
* QA review
* Code review
* Mentoring session
* Testing session

Conceptual model:

```text
Session
------------
id
type
status
started_at
completed_at
outcome
```

Participants join sessions through roles.

```text
Session
   |
   +-- Participant A
   |       Role: Client
   |
   +-- Participant B
           Role: Supporter
```

---

# Relationship

Relationships connect entities together.

Supportable is fundamentally a relationship graph.

Examples:

```text
Participant creates Solution

Participant fulfills Role

Solution addresses Intent

Participant reviews Solution

Solution depends on Solution

Evidence validates Solution
```

Conceptual model:

```text
Relationship
------------
id
source_id
relationship_type
target_id
context
created_at
```

Relationship types:

```text
creates
uses
reviews
tests
improves
supports
depends_on
addresses
fulfills_role
validates
```

---

# Reputation

Reputation is derived from participation history and evidence.

Reputation should not be a simple score.

It should be explainable.

Example:

```text
Participant:
Joshua

Role:
Supporter

Evidence:
- 200 completed sessions
- 95% successful outcomes
- 50 positive reviews
- 5 verified solutions
```

Conceptual model:

```text
Reputation Event
----------------
id
participant_id
role_id
event_type
impact
evidence_id
created_at
```

---

# Future Graph Model

The long-term architecture may represent Supportable as a graph:

```text
                 Participant
                      |
                      |
                   Role
                      |
                      |
                    Intent
                      |
                      |
                  Solution
                      |
                      |
                  Evidence
                      |
                      |
                Reputation
```

Every node gains meaning through relationships.

---

# Design Principles

## 1. Avoid premature specialization

Supportable should not create separate systems for:

* Support tickets
* Bug reports
* Reviews
* Questions
* Documentation

These are different expressions of the same underlying patterns.

---

## 2. Preserve human agency

Agents may assist with:

* Clarifying intent
* Finding solutions
* Evaluating evidence
* Performing actions

Humans remain participants with authority over their intent and decisions.

---

## 3. Evidence over opinion

Trust should be built from:

* Outcomes
* Testing
* Reviews
* History
* Transparency

---

## 4. Extensible by design

The data model should allow future support for:

* New participant types
* New roles
* New solution types
* New relationship types
* New applications

---

# Initial Implementation Mapping

A first Supabase implementation may begin with:

```text
participants

roles

participant_roles

intents

contexts

solutions

sessions

evidence

relationships

reputation_events
```

This schema is intentionally minimal and can evolve as the system learns from real usage.
