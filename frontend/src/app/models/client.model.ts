// THIS IS A EXAMPLE OF USING THE TEMPLATE MODEL FOR CREATING A NEW MODEL.

import { DBModel } from './dbmodel.model';

//========================= MODEL ===============================
export class Client extends DBModel {
    /**
     * Default model values, these are used to identify your model and the way it should or should not be saved.
     */
    _name = "Client";     // Name of the model. This is used to build the backend function call for the save. In this case this will be saveClient
    saveModel = true;     // Delete if you do not want to set it to false. By default it's true in the DBModel, this will prevent this model from being saved if set to false.
    loadModel = true;     // Delete if you do now want to set it to false. By default it's true in the DBModel, this will prevent this model from being loaded.
    saveKey = "model";    // The key that should be used for the dictionary that is passed to the backend.
    dbFields = ["id", "name", "surname"]   // Fields that comes from the database and should be saved to the database.
    loadFields = ["id"]   // The fields that are used to load the model from the DB if needed.

    /**
     * DB Fields. !!!! THESE FIELDS MUST HAVE DEFAULT VALUES IN ORDER TO WORK !!!!.
     */
    id: string = null;
    name: string = "";
    surname: string = "";

    /**
     * Override the constructor, to use this models data . Thats why super(data) and super.init(data). SHOULD ALWAYS INCLUDE THIS!.
     * @param data [Object] - Data to initialze the fields with.
     */
    constructor(data?) {
        super();
        this.init(data);
    }
}
// =================================================================