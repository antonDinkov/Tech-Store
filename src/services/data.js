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
        brand: data.brand,
        model: data.model,
        hardDisk: data.hardDisk,
        screenSize: data.screenSize,
        ram: data.ram,
        operatingSystem: data.operatingSystem,
        cpu: data.cpu,
        gpu: data.gpu,
        price: Number(data.price),
        color: data.color,
        weight: data.weight,
        image: data.image,
        preferredList: [],
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
        record.brand= newData.brand;
        record.model= newData.model;
        record.hardDisk= newData.hardDisk;
        record.screenSize= newData.screenSize;
        record.ram= newData.ram;
        record.operatingSystem= newData.operatingSystem;
        record.cpu= newData.cpu;
        record.gpu= newData.gpu;
        record.price= Number(newData.price);
        record.color= newData.color;
        record.weight= newData.weight;
        record.image= newData.image;

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