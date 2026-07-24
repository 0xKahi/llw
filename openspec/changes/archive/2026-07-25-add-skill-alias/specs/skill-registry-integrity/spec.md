# Delta: skill-registry-integrity

## ADDED Requirements

### Requirement: Enforce globally unique skill aliases
Each registry entry MAY declare at most one alias. An alias MUST NOT equal its own skill's name, MUST NOT equal any other registered skill name, and MUST NOT be declared by more than one skill. Registry construction MUST fail when any alias uniqueness rule is violated.

#### Scenario: Reject an alias equal to its own skill name
- **WHEN** a skill entry declares an alias identical to its own registry key
- **THEN** registry construction throws an alias uniqueness error

#### Scenario: Reject an alias colliding with another skill name
- **WHEN** a skill entry declares an alias equal to a different entry's registry key
- **THEN** registry construction throws an alias uniqueness error

#### Scenario: Reject a duplicate alias across skills
- **WHEN** two different skill entries declare the same alias
- **THEN** registry construction throws an alias uniqueness error

#### Scenario: Accept distinct aliases
- **WHEN** every declared alias is unique across all aliases and skill names
- **THEN** registry construction succeeds
