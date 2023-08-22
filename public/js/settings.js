String.prototype.replaceAll = function (f, e) {//把f替换成e
  var reg = new RegExp(f, "g"); //创建正则RegExp对象
  return this.replace(reg, e);
}

$(document).ready(function () {
  $('#temperature_slider_id').on('input', function () {
    $('#temperature_value_id').text($(this).val());
  });
  $('#top_p_slider_id').on('input', function () {
    $('#top_p_value_id').text($(this).val());
  });
  $('#frequency_penalty_slider_id').on('input', function () {
    $('#frequency_value_id').text($(this).val());
  });
  $('#presence_penalty_slider_id').on('input', function () {
    $('#presence_value_id').text($(this).val());
  });
  $('#max_tokens_slider_id').on('input', function () {
    $('#max_tokens_value_id').text($(this).val());
  });
});

function openSettings() {
  $("#settings_form_id").addClass("open");
}

function closeSettings() {
  $("#settings_form_id").removeClass("open");
}

function closeMarkdown() {
  $("#markdown_text_id").removeClass("open");
}

function openMarkdown() {
  let markdownBox = $("#markdown_text_id");
  let title = $("#topline_title_id").text();
  if (title == "") {
    title = "New Conversation"
  }
  let conversation = "";
  for (let i = 0; i < message["id"].length; i++) {
    let timestamp = new Date(message["timestamp"][i]).getTime();
    let formattedTimestamp = new Date(timestamp).toLocaleString();
    conversation += `## ${message["role"][i]} on ${formattedTimestamp}\n\n${message["content"][i]}\n\n`;
  }
  const markdownedMsg = `# ${title}\n\n${conversation}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(markdownedMsg)
      .then(() => {
        console.log('Text copied to clipboard:\n\n', markdownedMsg);
      })
      .catch((error) => {
        console.error('Failed to copy text: ', error);
      });
  } else {
    console.warn('Clipboard API not supported on this browser...');
  }
  markdownBox.addClass("open");
  markdownBox.html(md.render(`
*The following markdown has been copied to your clipboard automatically.*

**If not, copy it by yourself!**

\`\`\`markdown
${markdownedMsg.replaceAll("`", "\\`")}
\`\`\`
`))
  markdownBox.append($("<button>", {
    class: "mdl-button mdl-js-button mdl-js-ripple-effect",
    onclick: "closeMarkdown()",
    text: "关闭"
  }));
  componentHandler.upgradeDom();
}
