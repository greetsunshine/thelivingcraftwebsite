# The Agent Failure Triage Kit
#
# Everything here runs offline. No model is called, nothing touches a network,
# and the clock is virtual, so the whole suite finishes in well under a second.

PY := .venv/bin/python
PIP := .venv/bin/pip

.PHONY: help setup test naive fixed matrix schemas pdf clean

help:
	@echo "make setup    install the dependencies into .venv"
	@echo "make naive    run the story against the orchestrator that has no bug"
	@echo "make fixed    run the same faults against the corrected design"
	@echo "make test     run the twelve failure-injection tests"
	@echo "make matrix   run the tests against both designs, write the table"
	@echo "make pdf      (not built yet; the kit is on the website)"
	@echo "make clean    remove build output and caches"

setup:
	python3 -m venv .venv
	$(PIP) install --quiet --upgrade pip
	$(PIP) install --quiet -r requirements.txt

test:
	$(PY) -m pytest tests/ -q

naive:
	@$(PY) -m sim.naive_orchestrator

fixed:
	@$(PY) -m sim.orchestrator

matrix:
	@$(PY) tools/build_matrix.py

schemas:
	@$(PY) tools/build_examples.py

pdf:
	@echo "The standalone PDF is not built yet. The written kit is at"
	@echo "https://learning.thelivingcraft.ai/resources/agent-failure-triage-kit"
	@echo "and has a Download as PDF control."

clean:
	rm -rf dist/*.pdf dist/pages .pytest_cache tests/.results-*.json
	find . -name __pycache__ -type d -prune -exec rm -rf {} +
