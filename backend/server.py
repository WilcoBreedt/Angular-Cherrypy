# ======== IMPORTS ===================================================================================================================== 
import sys, getopt, cherrypy, json, os, argparse
import importlib.util
from cherrypy.lib import sessions
import logging

# logging.basicConfig(filename="main_logfile.log", filemode="w", format="%(asctime)s %(message)s", level=logging.INFO)
logging.basicConfig(format="%(asctime)s %(message)s", level=logging.INFO)

# ======== GLOBAL VARS =================================================================================================================
SETTINGS_FILE = None
ARGUMENTS = []

# ======== GLOBAL FUNCTIONS ============================================================================================================
def CORS():
    # This sets the response headers , anything you want in the headers to be returned must be done here.
    server_settings = SETTINGS_FILE.get("cherrypy", None) # Load settings for cherrypy
    # cherrypy.response.headers["Access-Control-Allow-Origin"] = "*"
    # The sessions and session validation is not working correctly right now with the custom hosting etc. Need to fix this.
    cherrypy.response.headers["Access-Control-Allow-Origin"] = ARGUMENTS.client_host if ARGUMENTS.client_host else server_settings.get("client_host", "http://127.0.0.1:4200")
    cherrypy.response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    cherrypy.response.headers["Access-Control-Allow-Credentials"] = "true"

class server(object):    
    def __init__(self):
        self.module_dict = {}
        self.build_modules()

    def build_modules(self):
        for module in os.listdir(os.getcwd()+"/modules"):
            if module[-3:] == ".py":
                self.module_dict[module[:-3]] = importlib.util.spec_from_file_location(module[:-3], os.getcwd()+"/modules"+"/"+str(module))

    @cherrypy.expose
    def default(self, *args, **kwargs):
        """
        Function: Default function that parses and calls the correct module with the function and parameters. Then parses it and sends the result back to the
                  url call from where it came.
        """
        # Get Module That should be called from the url example http://127.0.0.1/test/getClient -> test will be the module.
        module_ = args[0]
        valid_module = True if self.module_dict.get(module_, None) else False # Check if the module exists

        # Get Function that should be called from the url example http://127.0.0.1/test/getClient -> getClient will be the function.
        func_ = args[1]

        # Get Parameters that was sent with the url request.
        params_ = json.loads(kwargs["parameters"])

        if valid_module:
            try:
                params_["session"] = cherrypy.session.get("user", None)

                # logging.info to know what is happening
                logging.info("*************************** CALLING ****************************")
                logging.info("MODULE: %s; \nFUNCTION: %s; \nPARAMETERS: %s;"%(module_, func_, str(params_)))
                logging.info("****************************************************************")                

                # Call the module with the function
                data = self.callModuleFunc(module_, func_, params_)
                result = True
                msg = "Success"
            except Exception as ex:
                logging.info("******************** EXCEPTION OCCURED *************************")
                logging.info("MODULE: %s; \nFUNCTION: %s; \nPARAMETERS: %s; \nEXCEPTION: %s;"%(module_, func_, str(params_), str(ex)))
                logging.info("****************************************************************")
                msg = str(ex) if str(ex) != "'%s' object has no attribute '%s'"%(module_, func_) else "Function %s does not exist on module %s"%(func_, module_) 
                data = None
                result = False
        else:
            logging.info("******************** EXCEPTION OCCURED *************************")
            logging.info("EXCEPTION: Module %s was not found"%(module_))
            logging.info("****************************************************************")
            msg = "MODULE " + module_ + " WAS NOT FOUND"
            data = None
            result = False
        ret = {
            "result": result,
            "msg": msg,
            "data": data
        }
        # Can also do the following instead of def CORS() function call in tools.CORS.on
        # cherrypy.response.headers["Access-Control-Allow-Origin"] = "*"
        # cherrypy.response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return json.dumps(ret)

    def getUser(self):
        if cherrypy.session.get("user", None):
            return cherrypy.session["user"]
        else:
            raise Exception("NOT LOGGED IN")

    def callModule(self, module_name):
        _module_ = importlib.util.module_from_spec(self.module_dict[module_name])
        self.module_dict[module_name].loader.exec_module(_module_)
        return getattr(_module_, module_name)(self)
    
    def callModuleFunc(self, module_name, func_name, params):
        return getattr(self.callModule(module_name), func_name)(**params)

# ======== INIT FUNCTION =================================================================================================================

if __name__ == "__main__":
    # You can run the server on a specific host and port on startup
    # You can also let the db init run in the init mode.
    # In order to this use the following format : python3 main.py --port=8080 --host=0.0.0.0 --init=True

    parser = argparse.ArgumentParser()
    parser.add_argument("--server_port", type=int)
    parser.add_argument("--server_host")
    parser.add_argument("--client_host")
    parser.add_argument("--init", type=bool)
    ARGUMENTS = parser.parse_args()
    if ARGUMENTS.server_port:
        logging.info("---------- Starting with PORT: %s ---------"%(ARGUMENTS.server_port))
    if ARGUMENTS.server_host:
        logging.info("---------- Starting with HOST: %s ---------"%(ARGUMENTS.server_host))
    # Load settings out of the settings file
    try:
        with open("settings.json") as settings_file:
            SETTINGS_FILE = json.load(settings_file)
    except:
        raise Exception("NO SETTINGS JSON FILE FOUND")

    server_settings = SETTINGS_FILE.get("cherrypy", None) # Load settings for cherrypy

    # If the settings file or the 
    if server_settings is None:
        raise Exception("CHERRYPY SETTINGS ARE EMPTY")

    cherrypy.tools.CORS = cherrypy.Tool("before_handler", CORS) # This MUST run before every request sent

    #Update cherrypy with the settings from the settings.json file
    cherrypy.config.update({
        "server.socket_host": ARGUMENTS.server_host if ARGUMENTS.server_host else server_settings["host"], # If the host arugunemnt is present rather use that argument otherwise use the host in the settings file
        "server.socket_port": ARGUMENTS.server_port if ARGUMENTS.server_port else server_settings["port"], # If the port arugunemnt is present rather use that argument otherwise use the port in the settings file
    })
    cherrypy.quickstart(server(), "", config={
        "/": {
            "tools.sessions.on": True,
            "tools.sessions.name": "session_id",
            "tools.sessions.locking": "explicit",
            "tools.sessions.timeout": 600,
            "tools.sessions.storage_type": "ram",
            "tools.CORS.on": True
            }
        })
