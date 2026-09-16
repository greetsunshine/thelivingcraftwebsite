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
	@echo "make pdf      build dist/Agent-Failure-Triage-Kit.pdf"
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
	$(PY) kit/build_pdf.py

clean:
	rm -rf dist/*.pdf dist/pages .pytest_cache tests/.results-*.json
	find . -name __pycache__ -type d -prune -exec rm -rf {} +
