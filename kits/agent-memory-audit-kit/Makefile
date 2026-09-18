# The Agent Memory Audit Kit
#
# Everything here runs offline. No model is called and nothing touches a
# network, so the whole suite finishes in well under a second.
#
# The PDF and the ZIP are built by `npm run build:kit` at the repo root,
# because the PDF is printed from the live page and needs the dev server.

PY := harness/.venv/bin/python
PIP := harness/.venv/bin/pip

.PHONY: help setup test naive clean

help:
	@echo "make setup    install the harness into harness/.venv"
	@echo "make test     run the seven failure tests against the reference store"
	@echo "make naive    run the same seven against the naive store (all fail)"
	@echo "make clean    remove caches"

setup:
	python3 -m venv harness/.venv
	$(PIP) install --quiet --upgrade pip
	$(PIP) install --quiet -e harness

test:
	cd harness && ../$(PY) -m pytest

# The leading dash tells make not to treat pytest's exit code as an error.
# Seven failures is the expected result here.
naive:
	-cd harness && ../$(PY) -m pytest --store=naive tests/test_failure_modes.py

clean:
	rm -rf .pytest_cache harness/.pytest_cache harness/*.egg-info
	find . -name __pycache__ -type d -prune -exec rm -rf {} +
