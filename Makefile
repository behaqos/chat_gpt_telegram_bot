
build: 
        docker build -t tgbot_seller .

run: 
        docker run -d --name tgbot_seller -p 4000:3000 --rm tgbot_seller