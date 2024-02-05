import mongoose from "mongoose";
import Posts from "../models/postModel.js";
import Users from "../models/userModel.js";
import Views from "../models/viewsModel.js";
import Followers from "../models/followersModel.js";
import Comments from "../models/commentModel.js";
import Tenant from "../models/tenantModel.js";

export const stats = async (req, res, next) => {
  try {
    const { query } = req.query;
    const { tenantId } = req.body.tenant;

    const numofDays = Number(query) || 28;

    const currentDate = new Date();
    const startDate = new Date();
    startDate.setDate(currentDate.getDate() - numofDays);

    const totalPosts = await Posts.find({
      tenant: tenantId,
      createdAt: { $gte: startDate, $lte: currentDate },
    }).countDocuments();

    const totalViews = await Views.find({
      tenant: tenantId,
      createdAt: { $gte: startDate, $lte: currentDate },
    }).countDocuments();

    // This needs to be corrected
    // const totalWriters = await Users.find({
    //   accountType: "Writer",
    // }).countDocuments();

    const totalComments = await Comments.find({
      tenant: new mongoose.Types.ObjectId(tenantId),
    }).countDocuments();

    const totalFollowers = await Users.find({ tenantId: tenantId });
    console.log({ totalFollowers });
    const viewStats = await Views.aggregate([
      {
        $match: {
          tenant: new mongoose.Types.ObjectId(tenantId),
          createdAt: { $gte: startDate, $lte: currentDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          Total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const followersStats = await Users.aggregate([
      {
        $match: {
          tenantId: new mongoose.Types.ObjectId(tenantId),
          createdAt: { $gte: startDate, $lte: currentDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          Total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const last5Followers = await Users.find({ tenantId: tenantId })
      .select("-password") // Exclude password from the result
      .sort({ _id: -1 })
      .limit(5);

    console.log({ last5Followers });
    const last5Posts = await Posts.find({ tenant: tenantId })
      .limit(5)
      .sort({ _id: -1 });

    res.status(200).json({
      success: true,
      message: "Data loaded successfully",
      totalPosts,
      totalViews,
      // totalWriters,
      followers: totalFollowers?.length,
      viewStats,
      followersStats,
      last5Followers: last5Followers,
      last5Posts,
      totalComments,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const getFollowers = async (req, res, next) => {
  try {
    const { tenantId } = req.body.tenant;
    // console.log({userId})
    // pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 8;
    const skip = (page - 1) * limit; //2-1 * 8 = 8

    const result = await Tenant.findById(tenantId).populate({
      path: "followers",
      options: { sort: { _id: -1 }, limit: limit, skip: skip },
      populate: {
        path: "followerId",
        select: "name email image accountType followers -password",
      },
    });

    const totalFollowers = await Tenant.findById(tenantId);

    const numOfPages = Math.ceil(totalFollowers?.followers?.length / limit);

    res.status(200).json({
      data: result?.followers,
      total: totalFollowers?.followers?.length,
      numOfPages,
      page,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const getPostContent = async (req, res, next) => {
  try {
    const { tenantId } = req.body.tenant;

    let queryResult = Posts.find({ tenant: tenantId })
      .sort({ _id: -1 })
      .populate({
        path: "comments",
        populate: { path: "user", select: "name" }, // Assuming you want to also populate the user details in each comment
      });

    // pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 8;
    const skip = (page - 1) * limit;

    //records count
    const totalPost = await Posts.countDocuments({ tenant: tenantId });
    const numOfPage = Math.ceil(totalPost / limit);

    queryResult = queryResult.skip(skip).limit(limit);

    const posts = await queryResult;

    res.status(200).json({
      success: true,
      message: "Content Loaded successfully",
      totalPost,
      data: posts,
      page,
      numOfPage,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const createPost = async (req, res, next) => {
  try {
    const { tenantId } = req.body.tenant;
    const { desc, img, title, slug, cat, shortDesc } = req.body;

    if (!(desc || img || title || cat || shortDesc)) {
      return next(
        "All fields are required. Please enter a description, title, category and select image."
      );
    }

    const post = await Posts.create({
      tenant: tenantId,
      desc,
      img,
      title,
      slug,
      cat,
      shortDesc,
    });

    res.status(200).json({
      sucess: true,
      message: "Post created successfully",
      data: post,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const commentPost = async (req, res, next) => {
  try {
    const { desc } = req.body;
    console.log(req.body);
    const { userId } = req.body.user;
    const { id, tenantId } = req.params;

    if (desc === null) {
      return res.status(404).json({ message: "Comment is required." });
    }

    const newComment = new Comments({
      desc,
      user: userId,
      post: id,
      tenant: tenantId,
    });
    console.log({ desc });
    console.log({ newComment });
    await newComment.save();

    //updating the post with the comments id
    const post = await Posts.findById(id);

    post.comments.push(newComment._id);

    await Posts.findByIdAndUpdate(id, post, {
      new: true,
    });

    res.status(201).json({
      success: true,
      message: "Comment published successfully",
      newComment,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.body.tenant;
    // Only include fields that exist in the request body for update
    const updateData = {};
    const allowedFields = [
      "title",
      "slug",
      "desc",
      "cat",
      "img",
      "status",
      "shortDesc",
    ];
    allowedFields.forEach((field) => {
      if (req.body.hasOwnProperty(field)) {
        updateData[field] = req.body[field];
      }
    });
    // console.log({ updateData });
    const post = await Posts.findOneAndUpdate(
      { _id: id, tenant: tenantId },
      updateData,
      { new: true }
    );
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json({ message: "Post updated successfully", post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPosts = async (req, res, next) => {
  try {
    const { cat, tenantId } = req.query;
    console.log({ cat, tenantId });
    let query = { status: true };

    if (cat) {
      query.cat = cat;
    } else if (tenantId) {
      query.tenant = tenantId;
    }

    let queryResult = Posts.find(query)
      .populate({
        path: "tenant",
        select: "name image -password",
      })
      .sort({ _id: -1 });

    // pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    //records count
    const totalPost = await Posts.countDocuments(queryResult);

    const numOfPages = Math.ceil(totalPost / limit);

    queryResult = queryResult.skip(skip).limit(limit);

    const posts = await queryResult;

    res.status(200).json({
      success: true,
      totalPost,
      data: posts,
      page,
      numOfPages,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const getPopularContents = async (req, res, next) => {
  const { tenantId } = req.params;
  try {
    const posts = await Posts.aggregate([
      {
        $match: {
          status: true,
          tenant: new mongoose.Types.ObjectId(tenantId),
        },
      },
      {
        $project: {
          title: 1,
          slug: 1,
          img: 1,
          cat: 1,
          views: { $size: "$views" },
          createdAt: 1,
        },
      },
      {
        $sort: { views: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    // const writers = await Users.aggregate([
    //   {
    //     $match: {
    //       accountType: { $ne: "User" },
    //     },
    //   },
    //   {
    //     $project: {
    //       name: 1,
    //       image: 1,
    //       followers: { $size: "$followers" },
    //     },
    //   },
    //   {
    //     $sort: { followers: -1 },
    //   },
    //   {
    //     $limit: 5,
    //   },
    // ]);

    res.status(200).json({
      success: true,
      message: "Successful",
      data: { posts },
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};
export const getRecentPosts = async (req, res, next) => {
  const { tenantId } = req.params;
  try {
    const recentPosts = await Posts.find({
      tenant: new mongoose.Types.ObjectId(tenantId),
      status: true,
    })
      .sort({ createdAt: -1 }) // Sort by creation date in descending order
      .limit(5) // Limit to 5 posts
      .select("title slug img cat views createdAt"); // Select specific fields

    res.status(200).json({
      success: true,
      message: "Recent posts fetched successfully",
      data: recentPosts,
    });
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: error.message });
  }
};
export const getPost = async (req, res, next) => {
  try {
    const { postId, tenantId } = req.params;

    const post = await Posts.findById(postId).populate({
      path: "tenant",
      select: "name image accountType -password",
    });

    const newView = await Views.create({
      tenant: tenantId,
      user: post?.user,
      post: postId,
    });

    post.views.push(newView?._id);

    await Posts.findByIdAndUpdate(postId, {
      $addToSet: { views: newView?._id },
    });

    res.status(200).json({
      success: true,
      message: "Successful",
      data: post,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const getComments = async (req, res, next) => {
  const { postId } = req.params;
  console.log(req.params);
  // console.log("postId:", postId);
  try {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid Post ID" });
    }
    const postComments = await Comments.find({ post: postId })
      .populate({
        path: "user",
        select: "name image -password",
      })
      .sort({ _id: -1 });

    res.status(200).json({
      sucess: true,
      message: "successfully",
      data: postComments,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const { tenantId } = req.body.tenant;
    const { id } = req.params;

    // Check if the document exists before attempting to delete
    const post = await Posts.findOne({ _id: id, tenant: tenantId });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    await Posts.findOneAndDelete({ _id: id, tenant: tenantId });

    res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { id, postId } = req.params;

    await Comments.findByIdAndDelete(id);

    //removing commetn id from post
    const result = await Posts.updateOne(
      { _id: postId },
      { $pull: { comments: id } }
    );

    if (result.modifiedCount > 0) {
      res
        .status(200)
        .json({ success: true, message: "Comment removed successfully" });
    } else {
      res.status(404).json({ message: "Post or comment not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};
export const getPostTenant = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Posts.findById(postId).populate({
      path: "tenant",
      select: "name image -password",
    });

    res.status(200).json({
      success: true,
      message: "Successful",
      data: post,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};
