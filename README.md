# NifeCloud
Node.js application that runs cloud related functions

## To run this locally
* Make sure your IP is connected to the QA DB instance
* Get the .env from a friendly dev
* run `npm i` in your terminal from the `functions` folder.
* run `npx db pull && npx prisma generate`
* run `npm start` in your terminal from the `functions` folder.

## BEFORE DEPLOYMENT
* Make sure you comment out the `index` function in `module.exports` in the `root/functions/index.js` file

# IMPORTANT
When you update the SQL schema make sure to run, before you run the server or deploy:
```
npx prism db pull
```
Then if you're running locally run:
```
npx prisma generate
```
If you're deploying, the script will run ^ on deploy.