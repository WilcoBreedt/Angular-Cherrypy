# Angular-Cherrypy
===
Angular 4 frontend with a Modular Python 3 Cherrypy backend, these are all explained in the server.py file and the test.py module.

The angular side has customized models that are used to save data to the backend. The nice thing about these models are that they save by simply calling model.save() and voila there you have it :)

To run the backend simply move into the backend folder and use python3 server.py
The server.py can accept aruguments like 
--server_host="127.0.0.1" or 
--server_port=8080
