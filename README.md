# Getting Started Dustbunny

To remove "order hashes match" and "already approved enough currency for trading" from output do this.
Inside node_modules/opensea-js/lib/seaport.js
comment out line 1121 and 1677 with // anywhere in front

In a new directory; from the command line enter

git clone https://github.com/azoni/dustbunny.git

enter the command:
cd dustbunny
(You're inside directory now so you just npm start as usual after below changes are made)

copy node_modules into dustbunny
copy old values.js and secret.js into dustbunny/src

inufra keys to into a list ['key1', 'key2, 'key3', 'key4'] must have 4

Follow format for OWNER_ADDRESS 
![image](https://user-images.githubusercontent.com/16966251/138020506-dee6e6b3-8b02-42e5-a036-53de876b9981.png)


remove image url from list in favorites. 
favorites: {
		'galacticapes': [9999],
		'cyberkongz': [3621],
    }
    
For future updates you simply enter from inside the directory

git pull origin main
    
   
(ignore this)    
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
