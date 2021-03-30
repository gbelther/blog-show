import { useEffect } from 'react';

export default function Comments() {
  useEffect(() => {
    const script = document.createElement('script');
    const anchor = document.getElementById('inject-comments-for-uterances');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('repo', 'gbelther/blog-show');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'github-dark');
    script.setAttribute('async', 'async');
    anchor.appendChild(script);
  }, []);

  return <div id="inject-comments-for-uterances" />;
}
