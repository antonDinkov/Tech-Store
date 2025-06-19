const { Data } = require('../models/Data');

//TODO replace with real data service according to exam description

async function getAll() {
    return Data.find().lean();
};

async function getLastThree() {
    return Data.find().sort({ _id: -1 }).limit(3).lean(); //последните три регистрирани продукта
};

async function getById(id) {
    return Data.findById(id).lean();
};

async function getByIdKey(id, key) {
    const result = await Data.findById(id).select(key).lean();
    return result?.[key] || [];
};

async function create(data, authorId) {
    const record = new Data({
        name: data.name,
        age: Number(data.age),
        system: data.system,
        type: data.type,
        moons: Number(data.moons),
        size: Number(data.size),
        rings: data.rings,
        description: data.description,
        image: data.image,
        likeList: [],
        owner: authorId

    });

    await record.save();

    return record;
};

async function update(id, userId, newData) {
    const record = await Data.findById(id);

    if (!record) {
        throw new Error("Record not found " + id);
    };

    if (record.owner.toString() != userId) {
        throw new Error("Access denied");
    };

    //TODO replace with real properties
    record.name = newData.name,
        record.age = Number(newData.age),
        record.system = newData.system,
        record.type = newData.type,
        record.moons = Number(newData.moons),
        record.size = Number(newData.size),
        record.rings = newData.rings,
        record.description = newData.description,
        record.image = newData.image,

    await record.save();

    return record;
};

async function interact(id, userId, interactorsListName) {
    const record = await Data.findById(id);

    if (!record) {
        throw new Error("Record not found " + id);
    };

    //TODO replace with real properties
    record[interactorsListName].push(userId);
    
    await record.save();

    return record;
}

async function deleteById(id, userId) {
    const record = await Data.findById(id);
    if (!record) {
        throw new Error("Record not found " + id);
    };

    if (record.owner.toString() != userId) {
        throw new Error("Access denied");
    };

    await Data.findByIdAndDelete(id);
};

module.exports = {
    getAll,
    getLastThree,
    getById,
    getByIdKey,
    create,
    update,
    interact,
    deleteById
}