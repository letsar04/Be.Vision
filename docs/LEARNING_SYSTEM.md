# Be.Vision Continuous Learning System

Be.Vision treats learning as a controlled lifecycle, not as an uncontrolled self-modifying production system.

## Learning loop

```
Production observations
        |
        v
 Feedback / corrections / hard examples
        |
        v
 Learning Dataset
        |
        v
 Dataset validation + deduplication
        |
        v
 Training / fine-tuning job
        |
        v
 Candidate Model
        |
        v
 Offline evaluation
        |
        v
 Regression / safety / quality gates
        |
        +---- fail ----> archive
        |
        v
 Staging / shadow evaluation
        |
        v
 Model Registry
        |
        v
 Controlled promotion
        |
        v
 Production
        |
        +---- monitoring ----> rollback if required
```

## Separate three kinds of learning

### 1. Memory learning

Agents can immediately learn from new events, operator feedback, configuration and retrieved knowledge.

This is low risk because it does not change model weights.

### 2. Dataset learning

Useful examples, corrections and hard cases are collected into versioned datasets.

Each example should record:

- tenant
- source event
- timestamp
- labels
- annotator/source
- consent/legal basis where relevant
- model version that produced the original prediction
- correction
- quality/review status

### 3. Weight learning

Fine-tuning changes model parameters and must be treated as a deployment artifact.

A production model must never be replaced merely because a new training job completed.

## Model registry

Every model version should have:

- model id
- task
- base model
- dataset version
- training configuration
- metrics
- evaluation set
- created_at
- status: candidate, staging, production, archived
- parent model
- rollback target

## Agent learning

Agents should improve through:

- better retrieval
- better tools
- better policies
- validated prompt/skill versions
- curated examples
- fine-tuned models when justified

An agent must not silently rewrite its own production policy or deploy its own model weights.

## Continuous evaluation

Maintain fixed evaluation sets so new training data cannot make the benchmark disappear.

Evaluate:

- precision/recall where applicable
- false positive / false negative rates
- latency
- resource consumption
- robustness to image quality
- regression against previous production version
- subgroup performance where legally and ethically appropriate

## Feedback sources

Feedback can come from:

- operator confirmation/rejection
- user correction
- duplicate-event resolution
- recognition enrollment corrections
- hard-negative detection
- manually reviewed incidents
- synthetic/augmented examples, clearly marked as synthetic

## Promotion

Recommended progression:

candidate -> evaluated -> staging -> shadow -> production

Promotion should be policy-driven and auditable.

## Rollback

Every production deployment must retain a known previous model so rollback is immediate.

## Important rule

"Continuous learning" means continuous collection, evaluation and improvement. It does not mean continuously changing production weights without validation.
