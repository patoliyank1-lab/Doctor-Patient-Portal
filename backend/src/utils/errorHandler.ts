export class UnknownError extends Error {
  statusCode: number = 500;
  constructor(error: any) {
    super(error);
    if (error.message && error.statusCode) {
      this.message = error.message;
      this.statusCode = error.statusCode;
    }
    // For Validation Error
    else if (error.name === "SequelizeUniqueConstraintError") {
      if (error.parent.code == "23505") {
        this.message = error.errors[0].message;
        this.statusCode = 400;
      }
    }
    // for Invalid Input
    else if (error.name === "SequelizeDatabaseError") {
      if (error.original.code == "22P02") {
        this.message = "Invalid Id.";
        this.statusCode = 400;
      }
    }
  }
}

export class AppError extends Error {
  statusCode: number;
  constructor(message:string, statusCode:number) {
    super(message);

    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

