function addDownloadButton(mediaElement) {
  if (
    mediaElement.parentElement.querySelector('.reddit-download-btn') ||
    mediaElement.closest('.ProfileAvatar') ||
    mediaElement.closest('[data-testid="user-avatar"]') ||
    mediaElement.closest('.SubredditIconView') ||
    mediaElement.width < 100
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
        url = mediaElement.src.replace('//is2.4chan.org', '//i.4cdn.org');
      } else if (mediaElement.tagName === 'VIDEO') {
        url = mediaElement.src;
      }
    } else {
      if (mediaElement.tagName === 'IMG') {
        url = mediaElement.src.replace(/\.gifv$/, '.gif');
        if (url.includes('preview.redd.it')) {
          url = url.replace('preview.redd.it', 'i.redd.it');
        }
      } else if (mediaElement.tagName === 'VIDEO') {
        const videoElement = mediaElement.tagName === 'SOURCE' ? mediaElement.parentElement : mediaElement;

        if (videoElement.src.includes('packaged-media.redd.it')) {
          url = videoElement.src.replace(/_\d+p\.mp4.*$/, '');
        } else if (videoElement.src.includes('v.redd.it')) {
          url = videoElement.src.split('DASH')[0].replace(/_\d+\.mp4.*$/, '');
        } else {
          const sources = videoElement.querySelectorAll('source');
          if (sources.length > 0) {
            url = sources[0].src.split('?')[0];
          } else {
            url = videoElement.src.split('?')[0];
          }
        }
      }
    }

    if (url) {
      try {
        let filename = url.split('/').pop().split('?')[0];
        if (!filename.includes('.')) {
          if (mediaElement.tagName === 'VIDEO' || mediaElement.tagName === 'SOURCE') {
            filename += '.mp4';
          } else {
            filename += '.gif';
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
    const container = mediaElement.closest('div[data-click-id="media"], div[data-click-id="image_media"]') || mediaElement.parentElement;
    if (container) {
      container.style.position = 'relative';
      container.appendChild(wrapper);
    } else {
      mediaElement.parentElement.style.position = 'relative';
      mediaElement.parentElement.appendChild(wrapper);
    }
  }
}

function observeContent() {
  const is4chan = window.location.hostname.includes('4chan.org');

  setTimeout(() => {
    const selector = is4chan
      ? '.fileThumb img, .fileThumb video'
      : 'img[src]:not([data-testid="user-avatar"]):not([class*="Avatar"]), video:not([class*="Avatar"])';

    document.querySelectorAll(selector).forEach(elem => {
      if (elem.tagName === 'SOURCE') {
        addDownloadButton(elem.parentElement);
      } else {
        addDownloadButton(elem);
      }
    });
  }, 1000);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.target.tagName) {
        const elem = mutation.target;
        if ((elem.tagName === 'IMG' || elem.tagName === 'VIDEO') &&
          (!elem.getAttribute('alt')?.includes('avatar') || is4chan)) {
          addDownloadButton(elem);
        }
      }

      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const selector = is4chan
            ? '.fileThumb img, .fileThumb video'
            : 'img[src]:not([data-testid="user-avatar"]):not([class*="Avatar"]), video:not([class*="Avatar"])';

          const mediaElements = node.querySelectorAll(selector);
          mediaElements.forEach(elem => {
            if (elem.tagName === 'SOURCE') {
              addDownloadButton(elem.parentElement);
            } else {
              addDownloadButton(elem);
            }
          });

          if ((node.tagName === 'IMG' || node.tagName === 'VIDEO') &&
            (!node.getAttribute('alt')?.includes('avatar') || is4chan)) {
            addDownloadButton(node);
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'data-click-id']
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', observeContent);
} else {
  observeContent();
} 