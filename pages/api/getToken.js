// 获取七牛云token

import qiniu from 'qiniu';

export default function handler(req, res) {
  const accessKey = process.env.accessKey;
  const secretKey = process.env.secretKey;
  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
  const options = {
    scope: 'fyforum-storage',
  };
  const putPolicy = new qiniu.rs.PutPolicy(options);
  const uploadToken = putPolicy.uploadToken(mac);
  return res.status(200).json({ token: uploadToken });
}
