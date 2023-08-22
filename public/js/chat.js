function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // 月份从0开始，需要加1
  const day = today.getDate();
  return year + '-' + month + '-' + day;
}

var countOfMsgs = 0;
const commentBoxMsg = "This is a comment which is can be edited by double-clicking. All blocks support [MarkDown](https://daringfireball.net/projects/markdown/). Click the **GENERATE** button to get the answer from GPT3.5\n \n - Add block below please click the `add` button. \n - Delete block please click the `delete` button \n - Block type can be changed by expanding the menu on the left \n - Comments are ignored when submiting to API. \n - System prompts target to guide GPT3.5 to generate what you want.";
const systemBoxMsg = `You are ChatGPT, a large language model trained by OpenAI.\n\nKnowledge cutoff: 2021-09\n\nCurrent date: ${getToday()}`; const userBoxMsg = "**This is where you put your questions, double-click to edit me.**";
const assistantBoxMsg = "This is where answers are generated.";
// message: [role, content, id, timestamp, cost tokens]
var message = {
  "id": [],
  "role": [],
  "content": [],
  "timestamp": [],
};
const iconDict = {
  "user": "face",
  "assistant": "chat",
  "system": "settings",
  "error": "error",
  "comment": "edit_note"
};

const md = new markdownit({
  linkify: true, // Autoconvert URLs into links
  // typographer: true, // Enable smartypants and other typographic replacements
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(lang, str, true).value}</code></pre>`;
      } catch (__) {
        // console.log("catch __ in line 26.")
      }
    } else {
      return `<pre class="hljs"><code>${hljs.highlightAuto(str).value}</code></pre>`;
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
  }
});

md.use(window.markdown_katex);

$(document).ready(function () {
  window.addEventListener("beforeunload", saveDataToStorage);
  getDataFromStorage()
    .then(result => {
      console.log('数据获取成功:', result);
    })
    .catch(error => {
      console.log('数据获取失败:', error);
      createBox("comment", commentBoxMsg, -1);
      createBox("system", systemBoxMsg, -1);
      createBox("user", userBoxMsg, -1);
      createBox("assistant", assistantBoxMsg, -1);
    });
});

function switchTo(index_, boxClass) {
  const box = $("#box_id" + index_);
  const btn = $("#headline_iconbtn_id" + index_);
  message["role"][message["id"].indexOf(String(index_))] = boxClass;
  btn.html(`<i class="material-icons">${iconDict[boxClass]}</i>`)
  box.removeClass("userBox systemBox assistantBox commentBox errorBox");
  box.addClass(boxClass + "Box");
  // console.log(message);
}

function makeNonEditable(index_) {
  const textarea = $("#content_id" + index_);
  const i = message["id"].indexOf(textarea.attr("index_"));
  const text = textarea.val();
  const div = $("<div>", {
    id: textarea.attr("id"),
    ondblclick: `makeEditable(${index_})`,
    index_: textarea.attr("index_"),
    hiddenText: text,
    html: md.render(text),
  });
  message["content"][i] = text;
  textarea.replaceWith(div);
  // console.log(message);
}

function makeEditable(index_) {
  const div = $("#content_id" + index_);
  const textarea = $("<textarea>", {
    val: div.attr("hiddenText"),
    id: div.attr("id"),
    index_: div.attr("index_"),
    onblur: `makeNonEditable(${index_})`,
    hiddenText: div.attr("hiddenText"),
    keydown: function () {
      //Auto-expanding textarea
      this.style.removeProperty("height");
      this.style.height = (this.scrollHeight + 10) + "px";
    },
    focus: function () {
      //Do this on focus, to allow textarea to animate to height...
      this.style.removeProperty("height");
      this.style.height = (this.scrollHeight + 10) + "px";
    }
  });
  div.replaceWith(textarea);
  textarea.focus();
}

async function createBox(boxClass, text, atwhere) {
  // create headline on the top.
  const headline = $("<div>", {
    id: "headline_id" + countOfMsgs,
    class: "head-line"
  });
  // create icons
  const icon1 = $("<span>", {
    class: "material-icons option-icons",
    text: "face"
  })
  const icon2 = $("<span>", {
    class: "material-icons option-icons",
    text: "settings"
  })
  const icon3 = $("<span>", {
    class: "material-icons option-icons",
    text: "chat"
  })
  const icon4 = $("<span>", {
    class: "material-icons option-icons",
    text: "edit_note"
  })
  // create the button using the MaterialButton function
  const classBtn = $("<button>", {
    id: "headline_iconbtn_id" + countOfMsgs,
    class: "mdl-button mdl-js-button mdl-button--icon"
  }).append($("<span>", {
    class: "material-icons",
    text: iconDict[boxClass]
  }));
  const deleteBtn = $("<button>", {
    id: "deletebtn_id" + countOfMsgs,
    class: "mdl-button mdl-js-button mdl-button--icon right-float-icons",
    onclick: `deleteBox(${countOfMsgs});`
  }).append($("<span>", {
    class: "material-icons",
    text: "delete"
  }));
  const editBtn = $("<button>", {
    id: "editbtn_id" + countOfMsgs,
    class: "mdl-button mdl-js-button mdl-button--icon right-float-icons",
    onclick: `makeEditable(${countOfMsgs})`
  }).append($("<span>", {
    class: "material-icons",
    text: "edit"
  }));
  const addBtn = $("<button>", {
    id: "addbtn_id" + countOfMsgs,
    class: "mdl-button mdl-js-button mdl-button--icon right-float-icons",
    onclick: `addBox(${countOfMsgs})`
  }).append($("<span>", {
    class: "material-icons",
    text: "add"
  }));
  // create the menu using the MaterialMenu function
  const menu = $("<ul>", {
    class: "mdl-menu mdl-menu--bottom-left mdl-js-menu mdl-js-ripple-effect",
    for: "headline_iconbtn_id" + countOfMsgs,
  }).append(
    $("<li>", {
      class: "mdl-menu__item",
      onclick: `switchTo(${countOfMsgs}, "user")`,
      text: "User"
    }).prepend(icon1),
    $("<li>", {
      class: "mdl-menu__item",
      onclick: `switchTo(${countOfMsgs}, "system")`,
      text: "System"
    }).prepend(icon2),
    $("<li>", {
      class: "mdl-menu__item",
      onclick: `switchTo(${countOfMsgs}, "assistant")`,
      text: "Assistant"
    }).prepend(icon3),
    $("<li>", {
      class: "mdl-menu__item",
      onclick: `switchTo(${countOfMsgs}, "comment")`,
      text: "Comment"
    }).prepend(icon4),
  );
  const tipsForDelete = $("<div>", {
    class: "mdl-tooltip",
    for: "deletebtn_id" + countOfMsgs,
    text: "Delete that block"
  });
  const tipsForEdit = $("<div>", {
    class: "mdl-tooltip",
    for: "editbtn_id" + countOfMsgs,
    text: "Edit that block"
  });
  const tipsForAdd = $("<div>", {
    class: "mdl-tooltip",
    for: "addbtn_id" + countOfMsgs,
    text: "Add a new block below"
  });
  // append the button and menu to the div with class "head-line"
  headline.append(
    classBtn,
    menu,
    addBtn,
    tipsForAdd,
    deleteBtn,
    tipsForDelete,
    editBtn,
    tipsForEdit,
  );
  // create content container
  content = $("<div>", {
    id: "content_id" + countOfMsgs,
    index_: countOfMsgs,
    ondblclick: `makeEditable(${countOfMsgs})`,
    hiddenText: text,
  });
  // create the div box
  const box = $("<div>", {
    index_: countOfMsgs,
    id: "box_id" + countOfMsgs,
    class: "mdl-cell mdl-cell--12-col mdl-shadow--2dp",
  }).addClass(boxClass + "Box");
  box.append(headline).append(content);
  if (atwhere == -1) {
    content.html(md.render(text));
    message["role"].push(boxClass);
    message["content"].push(text);
    message["id"].push(String(countOfMsgs));
    message["timestamp"].push(Date.now());
    $("#conversation_container").append(box);
  } else {
    content.html(md.render(text));
    message["role"].splice(atwhere + 1, 0, boxClass);
    message["content"].splice(atwhere + 1, 0, text);
    message["id"].splice(atwhere + 1, 0, String(countOfMsgs));
    message["timestamp"].splice(atwhere + 1, 0, Date.now());
    $("#box_id" + message["id"][atwhere]).after(box);
  }
  componentHandler.upgradeDom();
  countOfMsgs++;
  return countOfMsgs - 1;
}

function submit() {
  // add loading effect
  $("#loading").removeClass("hidden");
  $("#btnContainer").addClass("hidden");
  componentHandler.upgradeDom();
  const roles = message["role"];
  const contents = message["content"];
  let processedMsg = [];
  let userQuestions = [];
  for (let i = 0; i < message["id"].length; i++) {
    if ((roles[i] === "user" || roles[i] === "system" || roles[i] === "assistant") &&
      (contents[i] != "*write something here*") &&
      (contents[i] != userBoxMsg) &&
      (contents[i] != assistantBoxMsg)
    ) {
      if (roles[i] === "user") {
        userQuestions.push(contents[i])
      }
      processedMsg.push({
        role: roles[i],
        content: contents[i]
      });
    }
  }
  // get response
  createBox("assistant", "", -1)
    .then((tmp_id) => {
      // console.log(tmp_id);
      editStreamBox(
        processedMsg,
        $("#content_id" + tmp_id),
      );
    });
  // get title
  if (userQuestions.length === 2) {
    // console.log(userQuestions);
    editStreamBox(
      [{
        "role": "user",
        "content": `这是一段对话中的所有问题：\n${userQuestions}\n请用简短的陈述句为这段对话起一个标题：`
      }],
      $("#topline_title_id"),
      true,
    );
  }
}

function addBox(index_) {
  const i = message["id"].indexOf(String(index_));
  createBox("user", "*write something here*", i);
  // console.log(message);
}

function deleteBox(index_) {
  const i = message["id"].indexOf(String(index_));
  message["role"].splice(i, 1);
  message["content"].splice(i, 1);
  message["id"].splice(i, 1);
  message["timestamp"].splice(i, 1);
  $("#box_id" + index_).remove();
  // console.log(message);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function editStreamBox(messages, content, istitile = false) {
  const apikey = $("#apikey_id").val().trim();
  const temperature = Number($("#temperature_value_id").text());
  const top_p = Number($("#top_p_value_id").text());
  const frequency_penalty = Number($("#frequency_value_id").text());
  const presence_penalty = Number($("#presence_value_id").text());
  const max_tokens = Number($("#max_tokens_value_id").text());
  let words = "";
  try {
    // 创建与OpenAI的流式传输API的连接
    const url = "/api/route";
    //直接获取 Fetch 的response， 无法使用 await的话， Promise的方式也是可以的。
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        apikey: apikey,
        messages: messages,
        temperature: temperature,
        top_p: top_p,
        frequency_penalty: frequency_penalty,
        presence_penalty: presence_penalty,
        max_tokens: max_tokens,
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
    //获取UTF8的解码
    const encode = new TextDecoder("utf-8");
    //获取body的reader
    const reader = response.body.getReader();
    // 循环读取reponse中的内容
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // console.log("Anwser finished.");
        // remove loading effect
        $("#btnContainer").removeClass("hidden");
        $("#loading").addClass("hidden");
        break;
      }
      // 解码内容
      const text = encode.decode(value);
      // 当获取错误token时，输出错误信息
      if (text === "<ERR>") {
        // console.log("Error.", text);
        break;
      } else {
        // 获取正常信息时，逐字追加输出
        words += text;
        if (istitile) {
          content.text(words);
        } else {
          content.attr("hiddenText", words);
          content.html(md.render(words));
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// 保存数据到本地存储
function saveDataToStorage() {
  console.log("saving data..")
  localStorage.setItem('countOfMsgs', countOfMsgs.toString());
  localStorage.setItem('message', JSON.stringify(message));
}

// 从本地存储中获取数据
function getDataFromStorage() {
  console.log("getting data..")
  return new Promise((resolve, reject) => {
    const savedCount = parseInt(localStorage.getItem('countOfMsgs'));
    const savedMessage = JSON.parse(localStorage.getItem('message'));
    if (savedCount !== null && savedMessage !== null) {
      countOfMsgs = savedCount;
      // message = savedMessage;
      const rolesTmp = savedMessage['role'];
      const contentsTmp = savedMessage['content'];
      for (let i = 0; i < savedMessage['id'].length; i++) {
        createBox(rolesTmp[i], contentsTmp[i], -1);
      }
      resolve(true);
    } else {
      reject(false);
    }
  });
}
