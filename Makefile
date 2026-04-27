SRCS_DIR = frontend
ENV_FILE = .env

setup:
	@if [ ! -f "$(ENV_FILE)" ]; then \
		echo "ERROR: $(ENV_FILE) not found."; \
		echo "Please create it before running the program."; \
		exit 1; \
	else \
		echo " .env file exists"; \
	fi

up: setup
	cd $(SRCS_DIR) && docker compose up --build

down:
	cd $(SRCS_DIR) && docker compose down

clean:
	cd $(SRCS_DIR) && docker compose down -v --rmi all --remove-orphans
	docker system prune -f

fclean: clean
	rm -f $(ENV_FILE)

reset: clean up

.PHONY: up down clean setup
