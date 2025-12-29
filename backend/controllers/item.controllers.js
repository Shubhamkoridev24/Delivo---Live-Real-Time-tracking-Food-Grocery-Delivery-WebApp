import { upload } from "../middlewares/multer.js";
import Item from "../models/item.model.js";
import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

export const addItem = async (req, res) => {
    try {
        console.log("addItem called, req.userId:", req.userId);
        const ownerId = req.userId || (req.user && req.user._id);
        if (!ownerId) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        const { name, category, foodType } = req.body;
        let { price } = req.body;
        if (!name || !category || !foodType || price == null) {
            return res.status(400).json({ message: "Missing required fields (name, category, foodType, price)" });
        }

        // ensure price is number
        price = Number(price);
        if (Number.isNaN(price)) {
            return res.status(400).json({ message: "Price must be a number" });
        }

        // image is required by your schema — ensure file present
        if (!req.file) {
            return res.status(400).json({ message: "Image file is required" });
        }

        let image;
        try {
            image = await uploadOnCloudinary(req.file.path);
        } catch (err) {
            console.error("Cloudinary upload failed:", err);
            return res.status(500).json({ message: "Image upload failed" });
        }

        const shop = await Shop.findOne({ owner: ownerId });
        if (!shop) {
            return res.status(400).json({ message: "shop not found" });
        }

        const item = await Item.create({
            name,
            category,
            foodType,
            price,
            image,
            shop: shop._id,
        });

        shop.items.push(item._id);
        await shop.save();

        const populatedShop = await Shop.findById(shop._id)
            .populate("owner")
            .populate({
                path: "items",
                options: { sort: { updatedAt: -1 } },
            });

        return res.status(201).json(populatedShop);
    } catch (error) {
        console.error("addItem error:", error);
        return res.status(500).json({ message: `add item error ${error.message || error}` });
    }
};

export const editItem = async (req, res) => {
    try {
        const itemId = req.params.itemId

        const { name, category, foodType, price } = req.body
        let image;
        if (req.file) {
            image = await uploadOnCloudinary(req.file.path)

        }

        const item = await Item.findByIdAndUpdate(itemId, {
            name, category, foodType, price, image
        }, { new: true })

        if (!item) {
            return res.status(400).json({ message: "item not found" })

        }
        const shop = await Shop.findOne({ owner: req.userId }).populate({
            path: "items",
            options: { sort: { updatedAt: -1 } }
        })

        return res.status(200).json(shop)

    } catch (error) {
        return res.status(500).json({ message: `edit item errror ${error}` })

    }
}



export const getItemById = async (req, res) => {
    try {
        const itemId = req.params.itemId
        const item = await Item.findById(itemId)

        if (!item) {
            return res.status(400).json({ message: "item not found" })

        }
        return res.status(200).json(item)
    } catch (error) {
        return res.status(500).json({ message: `get item errror ${error}` })

    }

}

export const deleteItem = async (req, res) => {
    try {
        const itemId = req.params.itemId
        const item = await Item.findByIdAndDelete(itemId)

        if (!item) {
            return res.status(400).json({ message: "item not found" })
        }
        const shop = await Shop.findOne({ owner: req.userId })
        shop.items = shop.items.filter(i => i._id !== item._id)
        await shop.save()
        await shop.populate({
            path: "items",
            options: { sort: { updatedAt: -1 } }
        })
        return res.status(200).json(shop)

    } catch (error) {
        return res.status(500).json({ message: `delete item errror ${error}` })

    }
}


export const getItemByCity = async (req, res) => {
    try {
        const { city } = req.params
        if (!city) {
            return res.status(200).json({ message: "city required" })
        }
        const shops = await Shop.find({
            city: { $regex: new RegExp(`^${city}$`, "i") } // case-insensitive
        }).populate("items");

        const shopIds = shops.map((shop) => shop._id)
        const items = await Item.find({ shop: { $in: shopIds } }).populate("shop", "name _id")
        return res.status(200).json(items)
    } catch (error) {
        return res.status(500).json({ message: `get item by city  errror ${error}` })

    }

}

export const getItemsByShop = async (req, res) => {
    try {
        const { shopId } = req.params
        const shop = await Shop.findById(shopId).populate("items")
        if (!shop) {
            return res.status(400).json("shop not found")
        }

        return res.status(200).json({
            shop,
            items: shop.items
        })
    } catch (error) {
        return res.status(500).json({ message: `get item by shop` })
    }
}


export const searchItems = async (req, res) => {
    try {
        const { query, city } = req.query;

        if (!query || !city) {
            return res.status(400).json({ message: "query and city required" });
        }

        const shops = await Shop.find({
            city: { $regex: new RegExp(`^${city}$`, "i") }
        }).populate("items");

        if (!shops || shops.length === 0) {
            return res.status(404).json({ message: "No shops found" });
        }

        const shopIds = shops.map(s => s._id);

        const items = await Item.find({
            shop: { $in: shopIds },
            $or: [
                { name: { $regex: query, $options: "i" } },
                { category: { $regex: query, $options: "i" } }
            ]
        })
            .populate({
                path: "shop",
                select: "name image"
            });

        return res.status(200).json(items);

    } catch (error) {
        return res.status(500).json({
            message: "Error searching items",
            error: error.message
        });
    }
};


export const rating = async (req, res) => {
    try {
        const { itemId, rating } = req.body
        if (!itemId || !rating) {
            return res.status(400).json({ message: "itemId and rating is required" })
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: "rating must be between 1 to 5" })

        }

        const item = await Item.findById(itemId)
        if (!item) {
            return res.status(400).json({ message: "item not found" })
        }
        const newCount = item.rating.count + 1
        const newAverage = (item.rating.average * item.rating.count + rating) / newCount

        item.rating.count = newCount
        item.rating.average = newAverage
        await item.save()
        return res.status(200).json({ rating: item.rating })
    } catch (error) {
        return res.status(500).json({ message: "rating error" })

    }
}