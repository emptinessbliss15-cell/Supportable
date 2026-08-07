# Supportable Supabase Architecture

## Overview

Supabase provides the initial backend foundation for Supportable.

Supportable uses Supabase as an implementation layer while maintaining a broader architecture based on:

- Participants
- Intent
- Solutions
- Evidence
- Relationships
- Evolution

The database is designed to support a living knowledge ecosystem rather than a traditional ticketing application.

---

# Database Philosophy

The Supportable database separates:

- Current operational data
- Historical evolution
- Proposed changes
- Evidence and trust

Live data should remain lean and efficient.

Historical and evolutionary information should preserve:

- Context
- Attribution
- Decisions
- Reviews
- Learning

---

# Current Core Tables

## participants

Represents entities participating in Supportable.

Types:

- Human
- Agent
- Organization

---

## roles

Defines possible participation roles.

Examples:

- Client
- Supporter
- Tester
- Reviewer
- Developer
- Agent

Roles are contextual.

A participant may fulfill many roles.

---

## intents

Represents what a participant is trying to accomplish.

Examples:

- Question
- Problem
- Goal
- Request
- Opportunity

Intent discovery is a core Supportable function.

---

## solutions

Represents possible ways to fulfill an intent.

Examples:

- Program
- Script
- Process
- Document
- Service
- Agent

Solutions evolve through evidence and review.

---

## evidence

Records outcomes and validation.

Examples:

- Successful completion
- Testing
- Reviews
- Feedback
- Verification

Evidence creates trust.

---

## relationships

Represents connections between entities.

Examples:

- Participant creates Solution
- Solution addresses Intent
- Participant reviews Solution
- Evidence validates Solution

Supportable is fundamentally relationship-based.

---

# Evolution Model

Supportable treats data as evolving.

Changes should not silently overwrite accepted knowledge.

The evolution process:
