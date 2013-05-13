document.write('<link href=\"https://gist.github.com/assets/embed-17ab34a51711628d8f5449c4663a9318.css\" media=\"screen\" rel=\"stylesheet\" />')
document.write('<div id=\"gist1412326\" class=\"gist\">\n      <div class=\"gist-file\">\n        <div class=\"gist-data gist-syntax\">\n\n\n\n  <div class=\"file-data\">\n    <table cellpadding=\"0\" cellspacing=\"0\" class=\"lines highlight\">\n      <tr>\n        <td class=\"line-numbers\">\n          <span class=\"line-number\" id=\"file-synchronous-js-L1\" rel=\"file-synchronous-js-L1\">1<\/span>\n          <span class=\"line-number\" id=\"file-synchronous-js-L2\" rel=\"file-synchronous-js-L2\">2<\/span>\n          <span class=\"line-number\" id=\"file-synchronous-js-L3\" rel=\"file-synchronous-js-L3\">3<\/span>\n          <span class=\"line-number\" id=\"file-synchronous-js-L4\" rel=\"file-synchronous-js-L4\">4<\/span>\n          <span class=\"line-number\" id=\"file-synchronous-js-L5\" rel=\"file-synchronous-js-L5\">5<\/span>\n          <span class=\"line-number\" id=\"file-synchronous-js-L6\" rel=\"file-synchronous-js-L6\">6<\/span>\n          <span class=\"line-number\" id=\"file-synchronous-js-L7\" rel=\"file-synchronous-js-L7\">7<\/span>\n          <span class=\"line-number\" id=\"file-synchronous-js-L8\" rel=\"file-synchronous-js-L8\">8<\/span>\n        <\/td>\n        <td class=\"line-data\">\n          <pre class=\"line-pre\"><div class=\"line\" id=\"file-synchronous-js-LC1\"><span class=\"c1\">// Good: write files asynchronously<\/span><\/div><div class=\"line\" id=\"file-synchronous-js-LC2\"><span class=\"nx\">fs<\/span><span class=\"p\">.<\/span><span class=\"nx\">writeFile<\/span><span class=\"p\">(<\/span><span class=\"s1\">&#39;message.txt&#39;<\/span><span class=\"p\">,<\/span> <span class=\"s1\">&#39;Hello Node&#39;<\/span><span class=\"p\">,<\/span> <span class=\"kd\">function<\/span> <span class=\"p\">(<\/span><span class=\"nx\">err<\/span><span class=\"p\">)<\/span> <span class=\"p\">{<\/span><\/div><div class=\"line\" id=\"file-synchronous-js-LC3\">  <span class=\"nx\">console<\/span><span class=\"p\">.<\/span><span class=\"nx\">log<\/span><span class=\"p\">(<\/span><span class=\"s2\">&quot;It&#39;s saved and the server remains responsive!&quot;<\/span><span class=\"p\">);<\/span><\/div><div class=\"line\" id=\"file-synchronous-js-LC4\"><span class=\"p\">});<\/span><\/div><div class=\"line\" id=\"file-synchronous-js-LC5\">&nbsp;<\/div><div class=\"line\" id=\"file-synchronous-js-LC6\"><span class=\"c1\">// BAD: write files synchronously<\/span><\/div><div class=\"line\" id=\"file-synchronous-js-LC7\"><span class=\"nx\">fs<\/span><span class=\"p\">.<\/span><span class=\"nx\">writeFileSync<\/span><span class=\"p\">(<\/span><span class=\"s1\">&#39;message.txt&#39;<\/span><span class=\"p\">,<\/span> <span class=\"s1\">&#39;Hello Node&#39;<\/span><span class=\"p\">);<\/span><\/div><div class=\"line\" id=\"file-synchronous-js-LC8\"><span class=\"nx\">console<\/span><span class=\"p\">.<\/span><span class=\"nx\">log<\/span><span class=\"p\">(<\/span><span class=\"s2\">&quot;It&#39;s saved, but you just blocked ALL requests!&quot;<\/span><span class=\"p\">);<\/span><\/div><\/pre>\n        <\/td>\n      <\/tr>\n    <\/table>\n  <\/div>\n\n        <\/div>\n\n        <div class=\"gist-meta\">\n          <a href=\"https://gist.github.com/brikis98/1412326/raw/04bdfd5e123b02a4245885fd187712ce7b79a809/Synchronous.js\" style=\"float:right\">view raw<\/a>\n          <a href=\"https://gist.github.com/brikis98/1412326#file-synchronous-js\" style=\"float:right; margin-right:10px; color:#666;\">Synchronous.js<\/a>\n          <a href=\"https://gist.github.com/brikis98/1412326\">This Gist<\/a> brought to you by <a href=\"http://github.com\">GitHub<\/a>.\n        <\/div>\n      <\/div>\n<\/div>\n')