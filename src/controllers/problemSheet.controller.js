import { db } from "../db/db.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllProblemSheets = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const sheets = await db.problemSheet.findMany({
    where: { userId },
    include: {
      problems: {
        include: {
          problem: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return res
    .status(200)
    .json(new ApiResponse(200, "Problem sheets fetched successfully.", sheets));
});
const getProblemSheetDetails = asyncHandler(async (req, res) => {
  const { sheetId } = req.params;
  if (!sheetId || sheetId.length < 36) {
    return res.status(400).json(new ApiError(400, "Invalid id"));
  }
  const userId = req.user.id;

  const sheet = await db.problemSheet.findUnique({
    where: {
      id: sheetId,
      userId,
    },
    include: {
      problems: {
        include: {
          problem: true,
        },
      },
    },
  });

  if (!sheet) {
    return res.status(404).json(new ApiError(404, "Problem sheet not found."));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Problem sheet details fetched successfully.", sheet)
    );
});
const createProblemSheet = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id;

  if (!name.trim()) {
    return res.status(400).json(new ApiError(400, "Sheet name is required."));
  }
  const sheet = await db.problemSheet.upsert({
    where: { name_userId: { name: name.toLowerCase(), userId } },
    create: { name, description, userId },
    update: { description },
  });
  return res
    .status(200)
    .json(new ApiResponse(200, "Problem sheet created successfully.", sheet));
});

const deleteProblemSheet = asyncHandler(async (req, res) => {
  const { sheetId } = req.params;
  if (!sheetId || sheetId.length < 36) {
    return res.status(400).json(new ApiError(400, "Invalid id"));
  }
  const deleteSheet = await db.problemSheet.delete({
    where: {
      id: sheetId,
    },
  });
  return res
    .status(200)
    .json(new ApiResponse(200, "Problem sheet deleted", deleteSheet));
});
const updateProblemSheet = asyncHandler(async (req, res) => {
  const { sheetId } = req.params;
  if (!sheetId || sheetId.length < 36) {
    return res.status(400).json(new ApiError(400, "Invalid id"));
  }
  const { name, description } = req.body;
  const userId = req.user.id;

  if (!name.trim()) {
    return res.status(400).json(new ApiError(400, "Sheet name is required."));
  }
  const currentSheet = await db.problemSheet.findUnique({
    where: { id: sheetId },
  });

  if (!currentSheet) {
    return res.status(404).json(new ApiError(404, "Sheet not found."));
  }
  const existingSheetWithName = await db.problemSheet.findUnique({
    where: {
      name_userId: {
        name: name.toLowerCase(),
        userId,
      },
    },
  });

  if (existingSheetWithName && existingSheetWithName.id !== sheetId) {
    return res
      .status(400)
      .json(new ApiError(400, "A sheet with this name already exists."));
  }
  const updatedSheet = await db.problemSheet.update({
    where: { id: sheetId },
    data: {
      name: name.toLowerCase(),
      description,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Problem sheet updated successfully.", updatedSheet)
    );
});

const addProblemToProblemSheet = asyncHandler(async (req, res) => {
  const { sheetId } = req.params;
  const { problemIds } = req.body;
  if (!problemIds || !Array.isArray(problemIds) || problemIds.length === 0) {
    return res.status(400).json(new ApiError(400, "Problem IDs are required."));
  }
  const problemInSheet = await db.ProblemInSheet.createMany({
    data: problemIds.map((problemId) => ({
      problemSheetId: sheetId,
      problemId,
    })),
    skipDuplicates: true,
  });
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        "Problems added to problem sheet successfully.",
        problemInSheet
      )
    );
});
const deleteProblemFromProblemSheet = asyncHandler(async (req, res) => {
  const { sheetId } = req.params;
  const { problemIds } = req.body;
  if (!problemIds || !Array.isArray(problemIds) || problemIds.length === 0) {
    return res.status(400).json(new ApiError(400, "Problem IDs are required."));
  }
  const deletedProblem = await db.ProblemInSheet.deleteMany({
    where: {
      problemSheetId: sheetId,
      problemId: {
        in: problemIds,
      },
    },
  });
  if (!deletedProblem.count) {
    return res.status(400).json(new ApiError(400, "Error while deleting"));
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Problems deleted to problem sheet successfully.",
        deletedProblem
      )
    );
});

export {
  getAllProblemSheets,
  getProblemSheetDetails,
  createProblemSheet,
  deleteProblemSheet,
  updateProblemSheet,
  addProblemToProblemSheet,
  deleteProblemFromProblemSheet,
};
