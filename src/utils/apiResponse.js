class ApiResponse {
  constructor(statusCode, message, data = null) {
    this.statusCode = statusCode;
    this.message = message;
    this.success = statusCode < 400;
    if (data !== null) {
      this.data = data;
    }
  }
}

export { ApiResponse };
