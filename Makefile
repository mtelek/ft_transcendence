jSRCS_DIR = srcs
ENV_FILE = $(SRCS_DIR)/.env

setup:
	@if [ ! -f "$(ENV_FILE)" ]; then \
		echo "ERROR: $(ENV_FILE) not found."; \
		echo "Please create it before running the program."; \
		exit 1; \
	else \
		echo " .env file exists"; \
	fi

secrets:
	@if [ ! -d "secrets" ]; then \
		mkdir secrets; \
		openssl rand -base64 16 > secrets/testing; \
		chmod 600 secrets/*.txt; \
		echo "Secrets created and secured"; \
	else \
		echo "Secrets directory already exists"; \
	fi

up: secrets setup
	cd $(SRCS_DIR) && docker compose up --build

down:
	cd $(SRCS_DIR) && docker compose down

clean:
	cd $(SRCS_DIR) && docker compose down -v --rmi all --remove-orphans
	docker system prune -f

fclean: clean
	rm -rf secrets
	rm -f $(ENV_FILE)

reset: clean up

.PHONY: up down clean setup secrets
