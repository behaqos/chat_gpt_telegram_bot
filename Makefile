build: 
		docker build -t tgbot_psy .

run: 
		docker run -d --name tgbot_psy -p 5000:3000 --rm tgbot_psy

stop:
		docker stop tgbot_psy