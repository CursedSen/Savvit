function addDownloadButton(mediaElement) {
  if (
    mediaElement.parentElement.querySelector('.reddit-download-btn') ||
    mediaElement.closest('.ProfileAvatar') ||
    mediaElement.closest('[data-testid="user-avatar"]') ||
    mediaElement.closest('.SubredditIconView')
  ) {
    return;
  }

  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'reddit-download-btn';
  downloadBtn.innerHTML = '> Download';

  downloadBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();

    let url;

    if (window.location.hostname.includes('4chan.org')) {
      if (mediaElement.tagName === 'IMG') {
        const linkElement = mediaElement.closest('a.fileThumb');
        url = linkElement ? linkElement.href : mediaElement.src.replace('//is2.4chan.org', '//i.4cdn.org');
      } else if (mediaElement.tagName === 'VIDEO') {
        url = mediaElement.src;
      }
    } else {
      if (mediaElement.tagName === 'IMG') {
        url = mediaElement.src;
        
        if (url.includes('preview.redd.it')) {
            const postIdMatch = url.match(/preview\.redd\.it\/(.*?)(?:\.(\w+))?(?:\?|$)/i);
            if (postIdMatch) {
                const [, postId, ext] = postIdMatch;
                const extension = ext || 'png';
                const cleanPostId = postId.split('-').pop();
                url = `https://i.redd.it/${cleanPostId}.${extension}`;
            }
        } else if (url.includes('external-preview.redd.it')) {
            const urlObj = new URL(url);
            const actualUrl = urlObj.searchParams.get('url');
            if (actualUrl) {
                url = decodeURIComponent(actualUrl);
            } else {
                const match = url.match(/external-preview\.redd\.it\/(\w+)(?:\.(\w+))?/i);
                if (match) {
                    const [, postId, ext] = match;
                    const extension = ext || 'png';
                    url = `https://i.redd.it/${postId}.${extension}`;
                }
            }
        }
        
        url = url.split('?')[0]
                .replace(/&amp;/g, '&')
                .replace(/\.htm$/, '');
        
        if (url.includes('imgur.com')) {
          url = url.replace(/\?.*$/, '')
                   .replace(/\.gifv$/, '.gif');
        }
      } else if (mediaElement.tagName === 'VIDEO') {
        const videoElement = mediaElement.tagName === 'SOURCE' ? mediaElement.parentElement : mediaElement;
        
        if (videoElement.src.includes('v.redd.it')) {
          url = videoElement.src;
          if (!url.includes('DASH')) {
            url = url.split('?')[0].replace(/_[0-9]+\.mp4/, '.mp4');
          }
        } else {
          const sources = videoElement.querySelectorAll('source');
          if (sources.length > 0) {
            url = Array.from(sources)
              .map(source => source.src)
              .sort((a, b) => b.localeCompare(a))[0]
              .split('?')[0];
          } else {
            url = videoElement.src.split('?')[0];
          }
        }
      }
    }

    if (url) {
      try {
        let filename = url.split('/').pop().split('?')[0];
        filename = filename.replace(/\.htm$/, '');

        if (!filename.includes('.')) {
            if (mediaElement.tagName === 'VIDEO' || mediaElement.tagName === 'SOURCE') {
                filename += '.mp4';
            } else {
                if (url.includes('.jpg') || url.includes('.jpeg')) {
                    filename += '.jpg';
                } else if (url.includes('.png')) {
                    filename += '.png';
                } else if (url.includes('.gif')) {
                    filename += '.gif';
                } else if (url.includes('.webp')) {
                    filename += '.webp';
                } else {
                    filename += '.jpg';
                }
            }
        }
        filename = `Savvit_${Date.now()}_${filename}`;

        chrome.runtime.sendMessage({
          action: 'download',
          url: url,
          filename: filename
        });
      } catch (error) {
        console.error('Download failed:', error);
      }
    }
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'reddit-download-btn-wrapper';
  wrapper.appendChild(downloadBtn);

  if (window.location.hostname.includes('4chan.org')) {
    const container = mediaElement.closest('.fileThumb') || mediaElement.parentElement;
    container.style.position = 'relative';
    container.appendChild(wrapper);
  } else {
    const container = mediaElement.closest('div[data-click-id="media"], div[data-test-id="post-content"], .media-element') || mediaElement.parentElement;
    container.style.position = 'relative';
    container.appendChild(wrapper);
  }
}

function observeContent() {
  const is4chan = window.location.hostname.includes('4chan.org');
  
  const checkAndAddButtons = () => {
    const selector = is4chan 
      ? '.fileThumb img, .fileThumb video'
      : 'div[data-click-id="media"] img, div[data-click-id="media"] video, a[href*="/gallery/"] img, div[data-test-id="post-content"] img, div[data-test-id="post-content"] video, div.media-element img, div.media-element video';

    const elements = document.querySelectorAll(selector);
    elements.forEach(elem => {
      if (!elem.closest('.reddit-download-btn-wrapper')) {
        addDownloadButton(elem);
      }
    });
    
    setTimeout(checkAndAddButtons, 2000);
  };

  checkAndAddButtons();

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const mediaElements = node.querySelectorAll('img, video');
            mediaElements.forEach(elem => {
              if (!elem.closest('.reddit-download-btn-wrapper')) {
                addDownloadButton(elem);
              }
            });
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', observeContent);
} else {
  observeContent();
}