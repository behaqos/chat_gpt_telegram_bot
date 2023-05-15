.PHONY: check-config build run

check-config:
	test -f config/production.json || (echo "config/production.json not found"; exit 1)

build: check-config
	docker build -t tgbot .

run: check-config
	docker run -d --name tgbot -p 3000:3000 --rm tgbot

