FROM node:14

WORKDIR /var/www/html

COPY package*.json ./

RUN npm install --no-optional

RUN npm install -g nodemon

COPY . .

COPY docker/entrypoint.sh /usr/local/bin

RUN chmod 777 /usr/local/bin/entrypoint.sh \
    && ln -s /usr/local/bin/entrypoint.sh /

CMD [ "/usr/local/bin/entrypoint.sh",  "nodemon", "index.js" ]
