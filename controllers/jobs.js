const { Mongoose } = require("mongoose");
const { BadRequestError, NotFoundError } = require("../errors");
const Job = require("../models/Job");
const { StatusCodes } = require("http-status-codes");

const getAllJobs = async (req, res) => {
  const jobs = await Job.find({ createdBy: req.user.userId }).sort("createdAt");
  res.status(StatusCodes.OK).send({ jobs, count: jobs.length });
};

const getJob = async (req, res) => {
  const {
    user: { userId },
    params: { id: jobId },
  } = req;
  const job = await Job.findOne({
    _id: jobId,
    createdBy: userId,
  });

  if (!job) {
    throw new NotFoundError("No Job with id ${jobId}");
  }

  res.status(StatusCodes.OK).json({ job });
};

const createJob = async (req, res) => {
  req.body.createdBy = req.user.userId;
  const job = await Job.create(req.body);

  res.status(StatusCodes.CREATED).json({ job });
};

const updateJob = async (req, res) => {
  const {
    body: { company, position },
    user: { userId },
    params: { id: jobId },
  } = req;

  if (company === "" || position === "") {
    throw new BadRequestError("Company or Position Fields cannot be empty");
  }

  const job = await Job.findByIdAndUpdate(
    { _id: jobId, createdBy: userId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!job) {
    throw new NotFoundError(`No Job with id ${jobId}`);
  }
  res.status(StatusCodes.OK).json({ job });
};

const deleteJob = async (req, res) => {
  const {
    body: { company, position },
    user: { userId },
    params: { id: jobId },
  } = req;

  const job = await Job.findOneAndRemove({
    _id: jobId,
    createdBy: userId,
  });
  if (!job) {
    throw new NotFoundError(`No Job with id ${jobId}`);
  }
  res.status(StatusCodes.OK).send();
};
const showStats = async (req, res) => {
  let stats = await Job.aggregate([
    {$match : { createdBy : Mongoose.Types.ObjectId(req.user.userId)}},
    {$group : { _id : '$status', count:{ $sum: 1}}},
  ])
  stats = stats.reduce((acc,curr)=> {
    const {_id: title, count} = curr
    acc[title] = count
    return acc
  },{})

  const defaultStats = {
    pending: stats.pending || 0,
    interview: stats.interview || 0,
    declined: stats.declined || 0
  }

  let monthlyApplications = await Job.aggregate([
    { $match: { createdBy: Mongoose.Types.ObjectId(req.user.userId) } },
    {
      $group : {
        _id: { year : { $year : '$createdAt'}, month:{$month: '$createdAt'}},
        count:{$sum:1}
      },
    },
    { $sort: { '_id.year': -1, '_id.month': -1}},
    { $limit: 6 }
  ])

  monthlyApplications = monthlyApplications.map((item) => {
    const { _id: {year, month}, count} = item;
    const date = moment().month(month-1).year(year).format('MMM Y')
    return {date, count}
  })
  res.status(StatusCodes.OK).json({ defaultStats,  monthlyApplications});
};

module.exports = {
  getAllJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  showStats
};
