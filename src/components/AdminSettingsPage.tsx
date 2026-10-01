import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHarvester } from '../context/HarvesterContext';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { AppUser, UserRole, CustomListItem } from '../types';
import { logActivity } from '../services/activityLogger';
import { cleanNumberInput, formatInputDisplay } from '../utils/numberUtils';

export const AdminSettingsPage: React.FC = () => {
  const { appUser, createUserByAdmin, changeMyPassword, sendResetEmail } = useAuth();
  const {
    businessSettings,
    updateBusinessSettings,
    listSettings,
    updateListSettings,
    clearAllDemoData,
    exportDataToCSV,
    drivers,
    addDriver,
    updateDriver,
    deleteDriver,
  } = useHarvester();

  const [activeTab, setActiveTab] = useState<'users' | 'business' | 'lists' | 'drivers' | 'data' | 'security'>('users');

  // Users tab state
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('partner');
  const [userActionMsg, setUserActionMsg] = useState<string | null>(null);
  const [userErrorMsg, setUserErrorMsg] = useState<string | null>(null);

  // Business tab state
  const [bizName, setBizName] = useState(businessSettings.businessName);
  const [harvesterModel, setHarvesterModel] = useState(businessSettings.harvesterModel);
  const [regNo, setRegNo] = useState(businessSettings.registrationNumber);
  const [p1Name, setP1Name] = useState(businessSettings.partner1Name);
  const [p2Name, setP2Name] = useState(businessSettings.partner2Name);
  const [shareP1, setShareP1] = useState(businessSettings.profitSharePartner1);
  const [shareP2, setShareP2] = useState(businessSettings.profitSharePartner2);

  // Driver tab state
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverRole, setDriverRole] = useState('Lead Operator');
  const [driverBata, setDriverBata] = useState<number>(1500);
  const [driverBonus, setDriverBonus] = useState<number>(150);

  // Security tab state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState<string | null>(null);

  // Data tools double confirm state
  const [clearConfirmStep, setClearConfirmStep] = useState<number>(0);

  // Load users list
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const items: AppUser[] = [];
      snap.forEach((d) => items.push({ uid: d.id, ...d.data() } as AppUser));
      setUsersList(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Update business form when context changes
  useEffect(() => {
    setBizName(businessSettings.businessName);
    setHarvesterModel(businessSettings.harvesterModel);
    setRegNo(businessSettings.registrationNumber);
    setP1Name(businessSettings.partner1Name);
    setP2Name(businessSettings.partner2Name);
    setShareP1(businessSettings.profitSharePartner1);
    setShareP2(businessSettings.profitSharePartner2);
  }, [businessSettings]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserActionMsg(null);
    setUserErrorMsg(null);

    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPass.trim()) {
      setUserErrorMsg('Please fill in all user fields: Full Name, Email, and Password.');
      return;
    }
    if (newUserPass.length < 6) {
      setUserErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsSubmittingUser(true);
    try {
      const res = await createUserByAdmin(newUserName, newUserEmail, newUserPass, newUserRole);
      setUserActionMsg(res?.message || `User "${newUserName}" created successfully as ${newUserRole.toUpperCase()}!`);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPass('');
      await fetchUsers();
      setTimeout(() => setUserActionMsg(null), 8000);
    } catch (err: any) {
      console.error(err);
      setUserErrorMsg(err.message || 'Failed to create user. Please check your network and permissions.');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleDeleteUser = async (uid: string, name: string) => {
    if (uid === appUser?.uid) {
      setUserErrorMsg('You cannot delete your own active Admin account.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', uid));
      await logActivity(appUser, 'delete', 'user', `Removed user ${name}`, uid, name);
      setUserActionMsg(`User "${name}" has been removed.`);
      fetchUsers();
      setTimeout(() => setUserActionMsg(null), 4000);
    } catch (err: any) {
      setUserErrorMsg(err.message || 'Failed to remove user.');
    }
  };

  const handleResetUserPassword = async (email: string) => {
    try {
      await sendResetEmail(email);
      setUserActionMsg(`Password reset link sent to ${email}. Please check your inbox.`);
      setTimeout(() => setUserActionMsg(null), 4000);
    } catch (err: any) {
      setUserErrorMsg(err.message || 'Failed to send reset email.');
    }
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    const p1Share = Number(shareP1) || 50;
    const p2Share = Number(shareP2) || 50;
    if (p1Share + p2Share !== 100) {
      alert('Profit share percentages must add up to 100%.');
      return;
    }
    await updateBusinessSettings({
      businessName: bizName.trim(),
      harvesterModel: harvesterModel.trim(),
      registrationNumber: regNo.trim(),
      partner1Name: p1Name.trim(),
      partner2Name: p2Name.trim(),
      profitSharePartner1: p1Share,
      profitSharePartner2: p2Share,
    });
    alert('Business and partner split configuration updated!');
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim()) return;

    if (editingDriverId) {
      await updateDriver(editingDriverId, {
        driverName: driverName.trim(),
        phone: driverPhone.trim(),
        role: driverRole.trim(),
        dailyBataRate: Number(driverBata) || 1500,
        acreBonusRate: Number(driverBonus) || 150,
      });
      setEditingDriverId(null);
    } else {
      await addDriver({
        driverName: driverName.trim(),
        phone: driverPhone.trim() || '9842000000',
        role: driverRole.trim(),
        acresToday: 0,
        engineHoursToday: 0,
        dailyBataRate: Number(driverBata) || 1500,
        acreBonusRate: Number(driverBonus) || 150,
        advancePaid: 0,
        balancePayable: 0,
        status: 'active',
      });
    }

    setDriverName('');
    setDriverPhone('');
    alert('Driver details saved!');
  };

  const handleAddListItem = async (categoryKey: keyof typeof listSettings, name: string) => {
    if (!name.trim()) return;
    const currentList = listSettings[categoryKey] as CustomListItem[];
    const newItem: CustomListItem = {
      id: name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
      name: name.trim(),
      hidden: false,
    };
    await updateListSettings({
      [categoryKey]: [...currentList, newItem],
    });
  };

  const handleToggleHideListItem = async (categoryKey: keyof typeof listSettings, id: string) => {
    const currentList = listSettings[categoryKey] as CustomListItem[];
    const updated = currentList.map((item) =>
      item.id === id ? { ...item, hidden: !item.hidden } : item
    );
    await updateListSettings({ [categoryKey]: updated });
  };

  const handleRenameListItem = async (categoryKey: keyof typeof listSettings, id: string, oldName: string) => {
    const newName = prompt(`Rename item:`, oldName);
    if (!newName || !newName.trim() || newName.trim() === oldName) return;
    const currentList = listSettings[categoryKey] as CustomListItem[];
    const updated = currentList.map((item) =>
      item.id === id ? { ...item, name: newName.trim() } : item
    );
    await updateListSettings({ [categoryKey]: updated });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPassMsg('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPassMsg('Passwords do not match.');
      return;
    }
    try {
      await changeMyPassword(newPassword);
      setPassMsg('Password successfully changed!');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPassMsg(err.message || 'Failed to update password.');
    }
  };

  const handleClearData = async () => {
    if (clearConfirmStep === 0) {
      setClearConfirmStep(1);
    } else if (clearConfirmStep === 1) {
      await clearAllDemoData();
      setClearConfirmStep(0);
      alert('All demo records have been cleared from the database.');
    }
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 pb-28 gap-4 max-w-xl mx-auto">
      {/* Title */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined text-[24px]">admin_panel_settings</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
              Admin Settings
            </h2>
            <span className="font-body-sm text-xs text-on-surface-variant font-medium">
              Only visible to Master Admin ({appUser?.name})
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:-mx-6 sm:px-6">
        {[
          { id: 'users', label: 'Users', icon: 'group' },
          { id: 'business', label: 'Business', icon: 'business' },
          { id: 'lists', label: 'Lists', icon: 'list' },
          { id: 'drivers', label: 'Driver', icon: 'sports_motorsports' },
          { id: 'data', label: 'Data Tools', icon: 'database' },
          { id: 'security', label: 'My Password', icon: 'lock' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`shrink-0 px-3.5 py-2 rounded-full font-label-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-secondary text-on-secondary shadow-xs'
                : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <div className="flex flex-col gap-4">
          {/* Add User Box */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col gap-3">
            <h3 className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-[18px]">person_add</span>
              <span>Add New User</span>
            </h3>

            {userActionMsg && (
              <div className="bg-secondary-container/70 text-on-secondary-container p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border border-secondary/20">
                <span className="material-symbols-outlined text-[18px] text-secondary shrink-0">check_circle</span>
                <span>{userActionMsg}</span>
              </div>
            )}

            {userErrorMsg && (
              <div className="bg-error-container/70 text-on-error-container p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border border-error/20">
                <span className="material-symbols-outlined text-[18px] text-error shrink-0">error</span>
                <span>{userErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="flex flex-col gap-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Full Name (e.g. Boopathi)"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface focus:outline-none"
                />
                <input
                  type="email"
                  required
                  placeholder="Email (e.g. boopathi@harvester.com)"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="password"
                  required
                  placeholder="Initial Password (min 6 chars)"
                  value={newUserPass}
                  onChange={(e) => setNewUserPass(e.target.value)}
                  className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface focus:outline-none"
                />
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface font-bold focus:outline-none"
                >
                  <option value="partner">Partner (Can add/edit entries, no delete)</option>
                  <option value="admin">Admin (Full permissions &amp; settings)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmittingUser}
                className="w-full h-11 rounded-full bg-secondary text-on-secondary font-bold text-xs shadow-xs hover:bg-secondary/95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                {isSubmittingUser ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-on-secondary border-t-transparent rounded-full animate-spin"></span>
                    <span>Creating User Account...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Create User Account</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Existing Users Table */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col gap-3">
            <h3 className="font-headline-sm text-sm font-bold text-on-surface">
              Authorized Users ({usersList.length})
            </h3>

            {loadingUsers ? (
              <span className="text-xs text-outline">Loading users...</span>
            ) : (
              <div className="flex flex-col gap-2">
                {usersList.map((usr) => (
                  <div
                    key={usr.uid}
                    className="bg-surface-container-low p-3 rounded-xl flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-on-surface text-sm">{usr.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            usr.role === 'admin'
                              ? 'bg-primary-fixed text-on-primary-fixed'
                              : usr.role === 'partner'
                              ? 'bg-secondary-container text-on-secondary-container'
                              : 'bg-surface-container text-outline'
                          }`}
                        >
                          {usr.role}
                        </span>
                        {usr.uid === appUser?.uid && (
                          <span className="text-[10px] text-secondary font-bold">(You)</span>
                        )}
                      </div>
                      <span className="text-outline text-xs block mt-0.5">{usr.email}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleResetUserPassword(usr.email)}
                        className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high font-semibold text-[11px]"
                        title="Send reset password link"
                      >
                        Reset PW
                      </button>

                      {usr.uid !== appUser?.uid && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(usr.uid, usr.name)}
                          className="w-7 h-7 rounded-full bg-error-container/60 text-error flex items-center justify-center hover:bg-error-container"
                          title="Remove user"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BUSINESS */}
      {activeTab === 'business' && (
        <form onSubmit={handleSaveBusiness} className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col gap-3.5">
          <h3 className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[18px]">business</span>
            <span>Contractor &amp; Partnership Profile</span>
          </h3>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-on-surface">Business / App Name</label>
            <input
              type="text"
              value={bizName}
              onChange={(e) => setBizName(e.target.value)}
              className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Harvester Model</label>
              <input
                type="text"
                value={harvesterModel}
                onChange={(e) => setHarvesterModel(e.target.value)}
                className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Registration No.</label>
              <input
                type="text"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-surface-container">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Partner 1 Name</label>
              <input
                type="text"
                value={p1Name}
                onChange={(e) => setP1Name(e.target.value)}
                className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface font-semibold"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Partner 1 Share %</label>
              <input
                type="number"
                value={shareP1}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setShareP1(val);
                  setShareP2(100 - val);
                }}
                className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface font-bold text-center"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Partner 2 Name</label>
              <input
                type="text"
                value={p2Name}
                onChange={(e) => setP2Name(e.target.value)}
                className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface font-semibold"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Partner 2 Share %</label>
              <input
                type="number"
                value={shareP2}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setShareP2(val);
                  setShareP1(100 - val);
                }}
                className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface font-bold text-center"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-full bg-secondary text-on-secondary font-bold text-xs shadow-xs hover:bg-secondary/95 transition-all mt-2 cursor-pointer"
          >
            Save Business Configuration
          </button>
        </form>
      )}

      {/* TAB 3: LISTS */}
      {activeTab === 'lists' && (
        <div className="flex flex-col gap-4">
          {(
            [
              { key: 'expenseCategories', title: 'Expense Categories' },
              { key: 'paymentModes', title: 'Payment Modes' },
              { key: 'crops', title: 'Crops Harvested' },
              { key: 'villages', title: 'Villages & Areas' },
            ] as const
          ).map((section) => {
            const items = listSettings[section.key] as CustomListItem[];
            return (
              <div
                key={section.key}
                className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-headline-sm text-sm font-bold text-on-surface">
                    {section.title}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const name = prompt(`Add new item to ${section.title}:`);
                      if (name) handleAddListItem(section.key, name);
                    }}
                    className="text-xs text-secondary font-bold hover:underline cursor-pointer"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {items.map((it) => (
                    <div
                      key={it.id}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
                        it.hidden
                          ? 'bg-surface-container text-outline line-through border-outline-variant'
                          : 'bg-surface-container-low text-on-surface border-outline-variant/40'
                      }`}
                    >
                      <span>{it.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRenameListItem(section.key, it.id, it.name)}
                        className="text-outline hover:text-secondary text-[11px] ml-0.5 cursor-pointer"
                        title="Rename item"
                      >
                        <span className="material-symbols-outlined text-[13px]">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleHideListItem(section.key, it.id)}
                        className="text-outline hover:text-on-surface text-[10px] ml-0.5 cursor-pointer font-bold uppercase tracking-wider"
                        title={it.hidden ? 'Show item' : 'Hide item'}
                      >
                        {it.hidden ? 'SHOW' : 'HIDE'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: DRIVERS */}
      {activeTab === 'drivers' && (
        <div className="flex flex-col gap-4">
          <form onSubmit={handleSaveDriver} className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col gap-2.5">
            <h4 className="font-headline-sm text-sm font-bold text-on-surface">
              {editingDriverId ? 'Edit Driver' : 'Add New Driver / Operator'}
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="Driver Name"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Role (e.g. Lead Operator)"
                value={driverRole}
                onChange={(e) => setDriverRole(e.target.value)}
                className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface"
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder="Daily Bata ₹"
                value={formatInputDisplay(driverBata)}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setDriverBata(Number(cleanNumberInput(e.target.value)) || 0)}
                className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface text-center font-bold"
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder="Acre Bonus ₹"
                value={formatInputDisplay(driverBonus)}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setDriverBonus(Number(cleanNumberInput(e.target.value)) || 0)}
                className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface text-center font-bold"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 h-11 rounded-full bg-secondary text-on-secondary font-bold text-xs shadow-xs cursor-pointer"
              >
                {editingDriverId ? 'Update Driver' : 'Save Driver'}
              </button>
              {editingDriverId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingDriverId(null);
                    setDriverName('');
                    setDriverPhone('');
                  }}
                  className="px-4 h-11 rounded-full bg-surface-container text-on-surface text-xs font-bold"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Drivers List */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col gap-2">
            <h4 className="font-headline-sm text-sm font-bold text-on-surface">
              Current Operators ({drivers.length})
            </h4>
            {drivers.map((d) => (
              <div key={d.id} className="bg-surface-container-low p-3 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-on-surface text-sm">{d.driverName}</span>
                  <span className="text-outline block text-xs">{d.role} • {d.phone}</span>
                  <span className="text-[11px] text-secondary font-semibold">
                    Bata: ₹{d.dailyBataRate} | Bonus: ₹{d.acreBonusRate}/acre
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDriverId(d.id);
                      setDriverName(d.driverName);
                      setDriverPhone(d.phone);
                      setDriverRole(d.role);
                      setDriverBata(d.dailyBataRate);
                      setDriverBonus(d.acreBonusRate);
                    }}
                    className="p-1.5 text-secondary hover:bg-surface-container rounded-lg"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete driver ${d.driverName}?`)) deleteDriver(d.id);
                    }}
                    className="p-1.5 text-error hover:bg-error-container/40 rounded-lg"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: DATA TOOLS */}
      {activeTab === 'data' && (
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col gap-4">
          <h3 className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[18px]">database</span>
            <span>Data Management &amp; Export</span>
          </h3>

          <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2">
            <h4 className="font-bold text-on-surface text-sm">Export to CSV / Excel</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Download all work entries, expense registers, driver advances, and machine care records into an Excel-friendly CSV spreadsheet.
            </p>
            <button
              type="button"
              onClick={exportDataToCSV}
              className="mt-1 h-11 px-4 rounded-full bg-secondary text-on-secondary font-bold text-xs shadow-xs hover:bg-secondary/90 flex items-center justify-center gap-2 cursor-pointer w-fit"
            >
              <span className="material-symbols-outlined text-[18px]">file_download</span>
              <span>Export All Data to CSV</span>
            </button>
          </div>

          <div className="bg-error-container/40 p-4 rounded-xl flex flex-col gap-2 border border-error/20">
            <h4 className="font-bold text-error text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">delete_forever</span>
              <span>Clear All Demo / Test Data</span>
            </h4>
            <p className="text-xs text-on-error-container leading-relaxed">
              Permanently purges all sample records from Firestore. User accounts, settings, and security credentials will be preserved.
            </p>

            <button
              type="button"
              onClick={handleClearData}
              className="mt-1 h-11 px-5 rounded-full bg-error text-on-error font-bold text-xs shadow-xs hover:bg-error/90 transition-all w-fit cursor-pointer"
            >
              {clearConfirmStep === 0
                ? 'Clear All Demo Data'
                : clearConfirmStep === 1
                ? 'Are you 100% sure? Click again to execute'
                : 'Clearing...'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: SECURITY / MY PASSWORD */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col gap-3">
          <h3 className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[18px]">lock</span>
            <span>Change My Password</span>
          </h3>

          {passMsg && (
            <div className="bg-secondary-container/60 text-on-secondary-container p-2.5 rounded-xl text-xs font-bold">
              {passMsg}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-on-surface">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-on-surface">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface"
            />
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-full bg-secondary text-on-secondary font-bold text-xs shadow-xs hover:bg-secondary/95 transition-all mt-1 cursor-pointer"
          >
            Update Password
          </button>
        </form>
      )}
    </div>
  );
};
