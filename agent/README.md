# Agent layer

The support agent is exposed through `/api/agent/run`. It models a tool-using workflow and returns its steps for evidence collection. In `vulnerable` mode, the agent trusts a requested identifier too far; in `secure` mode, it checks tenant scope before returning an observation.