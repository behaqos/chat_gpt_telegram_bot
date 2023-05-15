build:
	docker build -t tgbot .

run:
	docker run -d --name tgbot -p 3000:3000 --rm tgbot