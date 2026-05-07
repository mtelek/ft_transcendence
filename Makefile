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

# Production — HTTPS, no volume mounts
up: setup
	cd $(SRCS_DIR) && docker compose up --build

down:
	cd $(SRCS_DIR) && docker compose down

clean:
	cd $(SRCS_DIR) && docker compose down -v --rmi all --remove-orphans
	docker system prune -f

reset: clean up

# Development — HTTP on :3000, live code reload via volume mounts
dev: setup
	docker compose -f docker-compose.dev.yaml up --build --remove-orphans

dev-down:
	docker compose -f docker-compose.dev.yaml down

dev-clean:
	docker compose -f docker-compose.dev.yaml down -v --rmi all --remove-orphans
	docker system prune -f

dev-reset: dev-clean dev

lint:
	docker compose -f docker-compose.dev.yaml run --rm --no-deps frontend sh -lc "npm install --include=dev && npm run lint"

knip:
	docker compose -f docker-compose.dev.yaml run --rm --no-deps frontend sh -lc "npm install --include=dev && npx -y knip || true"

fclean: clean
	rm -f $(ENV_FILE)

.PHONY: up down clean reset setup dev dev-down dev-clean dev-reset lint knip fclean
