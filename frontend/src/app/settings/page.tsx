'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api, isAuthExpiredError } from '@/lib/api';
import { Crown } from 'lucide-react';

export default function SettingsPage() {
  const { user, isAdmin, isPremium, refreshMembership } = useAuth();
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [msg, setMsg] = useState('');
  const [redeemInput, setRedeemInput] = useState('');
  const [redeemMsg, setRedeemMsg] = useState('');
  const [showContact, setShowContact] = useState(false);

  const { data: membership } = useQuery({
    queryKey: ['membership'],
    queryFn: () => api.getMembership(),
    enabled: !!user,
  });

  const { data: contact } = useQuery({
    queryKey: ['membership-contact'],
    queryFn: () => api.getMembershipContact(),
    enabled: showContact,
  });

  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.changePassword({ oldPassword: oldPwd, newPassword: newPwd });
      setMsg('密码修改成功');
      setOldPwd('');
      setNewPwd('');
    } catch (err: any) {
      if (isAuthExpiredError(err)) return;
      setMsg(err.message || '修改失败');
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeemMsg('');
    try {
      const result = await api.redeemCode(redeemInput.trim());
      setRedeemMsg(`兑换成功！增加 ${result.daysAdded} 天会员，到期时间：${result.membershipExpireAt?.replace('T', ' ')}`);
      setRedeemInput('');
      refreshMembership();
    } catch (err: any) {
      if (isAuthExpiredError(err)) return;
      setRedeemMsg(err.message || '兑换失败');
    }
  };

  if (!user) return <div className="text-center py-12 text-gray-400">请先登录</div>;

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-semibold text-gray-900">设置</h1>

      {/* Membership Card */}
      {!isAdmin && (
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Crown size={18} className={isPremium ? 'text-amber-500' : 'text-gray-300'} />
            <h2 className="font-medium text-gray-900">会员信息</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">当前状态</span>
              <span className={isPremium ? 'text-amber-600 font-medium' : 'text-gray-400'}>
                {membership?.membershipActive ? '会员中' : membership?.membershipExpireAt ? '已过期' : '未开通'}
              </span>
            </div>
            {membership?.membershipExpireAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">到期时间</span>
                <span className="text-gray-700">{membership.membershipExpireAt.replace('T', ' ').substring(0, 19)}</span>
              </div>
            )}
            {membership?.remainingDays > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">剩余天数</span>
                <span className="text-gray-700">{membership.remainingDays} 天</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowContact(true)}
              className="flex-1 py-2.5 text-sm rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors">
              {isPremium ? '续费会员' : '购买会员'}
            </button>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContact && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowContact(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 text-center">{contact?.message || '请联系管理员开通高级功能'}</h3>
            <p className="text-sm text-gray-500 text-center">开通或续费后即可继续使用学习中心等高级功能</p>
            {contact?.wechat && (
              <div className="text-sm text-center text-gray-700">微信：{contact.wechat}</div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setShowContact(false); document.getElementById('redeem-input')?.focus(); }}
                className="flex-1 py-2.5 text-sm rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100">兑换卡密</button>
              <button onClick={() => setShowContact(false)}
                className="flex-1 py-2.5 text-sm rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200">关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* Redeem Code */}
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-medium text-gray-900">卡密兑换</h2>
        <form onSubmit={handleRedeem} className="space-y-3">
          <input id="redeem-input" type="text" placeholder="请输入卡密" value={redeemInput}
            onChange={e => setRedeemInput(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border-0 outline-none text-sm focus:ring-2 focus:ring-blue-100" />
          {redeemMsg && <p className={`text-sm ${redeemMsg.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>{redeemMsg}</p>}
          <button type="submit" disabled={!redeemInput.trim()}
            className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 disabled:opacity-40">兑换</button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-medium text-gray-900">修改密码</h2>
        <form onSubmit={handleChangePwd} className="space-y-3">
          <input type="password" placeholder="当前密码" value={oldPwd}
            onChange={e => setOldPwd(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border-0 outline-none text-sm focus:ring-2 focus:ring-blue-100" />
          <input type="password" placeholder="新密码" value={newPwd}
            onChange={e => setNewPwd(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border-0 outline-none text-sm focus:ring-2 focus:ring-blue-100" />
          {msg && <p className="text-sm text-gray-500">{msg}</p>}
          <button type="submit"
            className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-800">保存</button>
        </form>
      </div>
    </div>
  );
}
