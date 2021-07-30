const format = require("date-fns/format");

const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server is Running At http://localhost:3000`);
    });
  } catch (e) {
    console.log(`DB Error Message:${e.message}`);
  }
};

initializeDbAndServer();

const validateDuedate = (request, response, next) => {
  const { date } = request.query;

  try {
    if (date === undefined) {
      next();
    } else {
      if (date !== undefined) {
        const newDate = new Date(date);
        newDate.setMonth = newDate.getMonth() + 1;
        const result = format(newDate, "yyyy-MM-dd");
        request.body.date = result;
        next();
      }
    }
  } catch (e) {
    response.status(400);
    response.send(`Invalid Due Date`);
  }
};

const convertDbResponseToResponseObject = (eachTodo) => {
  return {
    id: eachTodo["id"],
    todo: eachTodo["todo"],
    priority: eachTodo["priority"],
    status: eachTodo["status"],
    category: eachTodo["category"],
    dueDate: eachTodo["due_date"],
  };
};

const checkingValidationsOfStatus = (request, response, next) => {
  const statusObject = request.body;
  if (statusObject.status === undefined) {
    next();
  } else {
    const expression = statusObject.status;
    switch (expression) {
      case "TO DO":
        next();
        break;
      case "IN PROGRESS":
        next();
        break;
      case "DONE":
        next();
        break;
      default:
        response.status(400);
        response.send(`Invalid Todo Status`);
        break;
    }
  }
};

const checkingValidationsOfPriority = (request, response, next) => {
  const queryObject = request.body;

  if (queryObject.priority === undefined) {
    next();
  } else {
    const expression = queryObject.priority;
    switch (expression) {
      case "HIGH":
        next();
        break;
      case "MEDIUM":
        next();
        break;
      case "LOW":
        next();
        break;
      default:
        response.status(400);
        response.send(`Invalid Todo Priority`);
        break;
    }
  }
};

//1. GET Todos API
app.get(
  "/todos/",
  validateDuedate,
  checkingValidationsOfStatus,
  checkingValidationsOfPriority,
  async (request, response) => {
    const {
      todo = "",
      priority = "",
      status = "",
      category = "",
      search_q = "",
    } = request.query;
    const getTodosQuery = `
        SELECT * FROM todo
        WHERE 
        ((todo LIKE '%${todo}%' AND todo LIKE '%${search_q}%') AND status LIKE '%${status}%') AND
        (priority LIKE '%${priority}%' AND category LIKE '%${category}%')
        ;
    `;
    const dbResponse = await db.all(getTodosQuery);
    response.send(
      dbResponse.map((eachTodo) => convertDbResponseToResponseObject(eachTodo))
    );
  }
);

//2.GET TODO with TODO ID API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT * FROM todo 
        WHERE id = ${todoId};
    `;
  const todo = await db.get(getTodoQuery);
  const todoArray = [todo];
  const result = todoArray.map((eachTodo) =>
    convertDbResponseToResponseObject(eachTodo)
  );
  response.send(...result);
});

//3.GET TODO based on date API
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  dateObject = new Date(date);
  formatedDate = format(dateObject, "yyyy-MM-dd");
  const getTodoQuery = `
    SELECT * FROM todo WHERE due_date = '${formatedDate}';
  `;
  const todo = await db.get(getTodoQuery);
  console.log(todo);
});

//4, ADD Todo API
app.post(
  "/todos/",
  validateDuedate,
  checkingValidationsOfPriority,
  checkingValidationsOfStatus,
  async (request, response) => {
    const { id, todo, priority, status, category, dueDate } = request.body;
    const addTodoQuery = `
        INSERT INTO todo(id,todo,priority,status,category,due_date)
        VALUES(
            ${id},
            '${todo}',
            '${priority}',
            '${status}',
            '${category}',
            '${dueDate}'
        );
    `;
    await db.run(addTodoQuery);
    response.send(`Todo Successfully Added`);
  }
);

//5. update TODO API
app.put(
  " /todos/:todoId/",
  validateDuedate,
  checkingValidationsOfPriority,
  checkingValidationsOfStatus,
  async (request, response) => {
    const { todoId } = request.params;
    const { todo, status, priority, category, dueDate } = request.body;
  }
);

//6.DELETE TODO API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        DELETE FROM todo
        WHERE id = ${todoId};
    `;
  await db.run(deleteTodoQuery);
  response.send(`Todo Deleted`);
});

module.exports = app;
