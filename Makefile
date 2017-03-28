.PHONY: clean check test

SRC = $(shell find src -name '*.js')
LIB = $(SRC:src/%.js=lib/%.js)
LIBDIR = lib
REPORTS = reports

all: node_modules lib

node_modules: package.json
	@npm install
	@touch $@

check:
	@eslint --ext .js,.jsx ./src

test: node_modules clean check
	@jest

clean:
	@rm -rf $(LIBDIR)
	@rm -rf $(REPORTS)

lib: $(LIB)
lib/%.js: src/%.js
#	@echo babel	$@...
	@mkdir -p $(@D)
	babel $< -o $@
