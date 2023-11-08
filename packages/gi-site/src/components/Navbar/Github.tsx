import { GithubOutlined } from '@ant-design/icons';
import { Button, Popover } from 'antd';
import * as React from 'react';
import { fetch } from 'umi-request';
import $i18n from '../../i18n';
import './github.less';
interface GithubProps {}

const Github: React.FunctionComponent<GithubProps> = props => {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    fetch('https://api.github.com/repos/antvis/G6VP')
      .then(res => {
        return res.json();
      })
      .then(res => {
        if (res.stargazers_count) setCount(res.stargazers_count);
      });
  }, []);

  const [githubPopVisible, setGithubPopVisible] = React.useState(
    !localStorage.getItem('GITHUB_POP_CLOSED') || localStorage.getItem('GITHUB_POP_CLOSED') === 'false',
  );

  const handleCloseGithubPopover = () => {
    setGithubPopVisible(false);
    localStorage.setItem('GITHUB_POP_CLOSED', 'true');
  };

  const handleJumpToGithub = () => {
    window.open('https://github.com/antvis/G6VP', '_blank');
    handleCloseGithubPopover();
  };
  const otherProps = githubPopVisible
    ? {
        open: githubPopVisible,
      }
    : {};

  return (
    <Button
        type="text"
        size="small"
        icon={<GithubOutlined />}
        onClick={() => {
          window.open('http://github.com/antvis/g6vp');
        }}
      >
        {count ? ` ${count}` : ''}
      </Button>
  );
};

export default Github;
