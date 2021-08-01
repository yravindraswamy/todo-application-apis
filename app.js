const express = require("express");
const app = express();

const format = require("date-fns/format");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");

app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server is Starting At http://localhost:3000`);
    });
  } catch (e) {
    console.log(`DB Error Message: ${e.message}`);
  }
};
initializeDbAndServer();

const convertDbResponseToResponseObject = (eachTodo) => {
  return {
    id: eachTodo["id"],
    todo: eachTodo["todo"],
    status: eachTodo["status"],
    priority: eachTodo["priority"],
    category: eachTodo["category"],
    dueDate: eachTodo["due_date"],
  };
};

const validateDueDate = (request, response, next) => {
  const { dueDate } = request.body;
  if (dueDate === undefined) {
    next();
  } else {
    try {
      const formatedDueDate = format(new Date(dueDate), "yyyy-MM-dd");
      request.body.dueDate = formatedDueDate;
      next();
    } catch {
      response.status(400);
      response.send(`Invalid Due Date`);
    }
  }
};

const validateStatus = (request, response, next) => {
  const { status } = request.body;
  if (status === undefined) {
    next();
  } else {
    switch (status) {
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

const validatePriority = (request, response, next) => {
  const { priority } = request.body;
  if (priority === undefined) {
    next();
  } else {
    switch (priority) {
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
const validateCategory = (request, response, next) => {
  const { category } = request.body;
  if (category === undefined) {
    next();
  } else {
    switch (category) {
      case "WORK":
        next();
        break;
      case "HOME":
        next();
        break;
      case "LEARNING":
        next();
        break;
      default:
        response.status(400);
        response.send(`Invalid Todo Category`);
        break;
    }
  }
};

//1. GET Todos API

app.get("/todos/", validateCategory, async (request, response) => {
  const {
    search_q = "",
    status = "",
    category = "",
    priority = "",
  } = request.query;
  //   console.log(search_q, status, category, priority);

  const getTodoQuery = `
        SELECT * FROM todo
        WHERE 
        (todo LIKE '%${search_q}%' AND status LIKE '%${status}%') AND 
        (category LIKE '%${category}%' AND priority LIKE '%${priority}%')
        ;
    `;
  const todoArray = await db.all(getTodoQuery);
  response.send(
    todoArray.map((eachTodo) => convertDbResponseToResponseObject(eachTodo))
  );
});

//2. GET specific Todo API
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

//3.GET todo ON DUE date API
app.get("/agenda/", async (request, response) => {
  try {
    const { date } = request.query;
    console.log(date);
    const formatedDate = format(new Date(date), "yyyy-MM-dd");
    const getTodoQuery = `
    SELECT * FROM todo WHERE due_date = '${formatedDate}';
  `;
    const todoArray = await db.all(getTodoQuery);
    response.send(
      todoArray.map((eachTodo) => convertDbResponseToResponseObject(eachTodo))
    );
  } catch {
    response.status(400);
    response.send(`Invalid Due Date`);
  }
});

//4. POST TODO API
app.post(
  "/todos/",
  validateDueDate,
  validateStatus,
  validatePriority,
  validateCategory,
  async (request, response) => {
    const { id, todo, status, category, priority, dueDate } = request.body;
    const postTodoQuery = `
        INSERT INTO todo(id,todo,status,category,priority,due_date)
        VALUES (
            ${id},
            '${todo}',
            '${status}',
            '${category}',
            '${priority}',
            '${dueDate}'
        );
    `;
    await db.run(postTodoQuery);
    response.send(`Todo Successfully Added`);
  }
);

//5. UPDATE todo
app.put(
  "/todos/:todoId/",
  validateDueDate,
  validateStatus,
  validatePriority,
  validateCategory,
  async (request, response) => {
    const { todoId } = request.params;
    const { todo, status, priority, category, dueDate } = request.body;
    if (todo !== undefined) {
      expression = "todo";
    }
    if (status !== undefined) {
      expression = "status";
    }
    if (priority !== undefined) {
      expression = "priority";
    }
    if (category !== undefined) {
      expression = "category";
    }
    if (dueDate !== undefined) {
      expression = "dueDate";
    }
    let upDateQuery;
    switch (expression) {
      case "status":
        const { status } = request.body;
        upDateQuery = `
                UPDATE todo
                SET 
                status = '${status}'
                WHERE id = ${todoId};
            `;
        await db.run(upDateQuery);
        response.send("Status Updated");
        break;
      case "priority":
        const { priority } = request.body;
        upDateQuery = `
                UPDATE todo
                SET 
                priority = '${priority}'
                WHERE id = ${todoId};
            `;
        await db.run(upDateQuery);
        response.send("Priority Updated");
        break;
      case "category":
        const { category } = request.body;
        upDateQuery = `
                  UPDATE todo
                  SET
                  category = '${category}'
                  WHERE id = ${todoId};
              `;
        await db.run(upDateQuery);
        response.send("Category Updated");
        break;
      case "dueDate":
        const { dueDate } = request.body;
        upDateQuery = `
                  UPDATE todo
                  SET
                  due_date = '${dueDate}'
                  WHERE id = ${todoId};
              `;
        await db.run(upDateQuery);
        response.send("Due Date Updated");
        break;
      case "todo":
        const { todo } = request.body;
        upDateQuery = `
                  UPDATE todo
                  SET
                  todo = '${todo}'
                  WHERE id = ${todoId};
              `;
        await db.run(upDateQuery);
        response.send("Todo Updated");
        break;
    }
  }
);

//6 DELETE API
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
