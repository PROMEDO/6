/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  AlertCircle,
  CheckCircle2,
  Edit,
  Eye,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import { ADDON_CATALOG } from '../../data/addonsCatalog';
import { formatNumber } from '../../utils/storage';
import {
  getAddonRequiredPlanLabel,
  getAddonRequiredPlanTier,
  isAddonAllowedForPlan,
} from '../../utils/plans';
import { playBellTone, surfaceCardStyle, themedInputStyle, useDashboard } from './DashboardContext';

function formatHourArabic(hour: number): string {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  const hh24 = `${String(h).padStart(2, '0')}:00`;
  if (h === 0) return `12:00 منتصف الليل (${hh24})`;
  if (h < 12) return `${h}:00 صباحاً (${hh24})`;
  if (h === 12) return `12:00 ظهراً (${hh24})`;
  return `${h - 12}:00 مساءً (${hh24})`;
}

export const AddonsPage: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const {
    rest,
    resolvedPlan,
    currency,
    allItems,
    addonsState,
    editingAddonKey,
    setEditingAddonKey,
    addonDraft,
    setAddonDraft,
    addonEditIntent,
    setAddonEditIntent,
    addonEditError,
    setAddonEditError,
    addonSaving,
    showPopupPreview,
    setShowPopupPreview,
    handleToggleAddon,
    handleOpenAddonEdit,
    handleSaveAddonEdit,
    handleDeviceImageUpload,
    openUpgradeModal,
  } = useDashboard();

  const localizedCatalog = ADDON_CATALOG;
  const allowedAddonsCount = localizedCatalog.filter((a) => isAddonAllowedForPlan(a.key, resolvedPlan)).length;
  const enabledCount = localizedCatalog.filter(
    (a) =>
      isAddonAllowedForPlan(a.key, resolvedPlan) &&
      Boolean((addonsState[a.key] as Record<string, any> | undefined)?.enabled)
  ).length;
  const visibleAddons = localizedCatalog;
  const addonsLimitText = `${enabledCount}/${allowedAddonsCount}`;

  const updateDraft = (updater: (prev: Record<string, any>) => Record<string, any>) => {
    if (addonEditError) setAddonEditError('');
    setAddonDraft(updater);
  };

  const closeEditModal = () => {
    setEditingAddonKey(null);
    setAddonEditError('');
    setAddonEditIntent('edit');
  };

  const activeMeta = editingAddonKey ? localizedCatalog.find((a) => a.key === editingAddonKey) : null;
  const activeSavedCfg = editingAddonKey
    ? ((addonsState[editingAddonKey] || {}) as Record<string, any>)
    : {};
  const requiresInitialSetup = addonEditIntent === 'enable' || !activeSavedCfg.configured;
  const currentLocalHour = new Date().getHours();

  const waTargetPhone = String(rest.social?.whatsapp || rest.ph || '').trim();

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
      <motion.div
        className="mp-items-toolbar"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        style={{ justifyContent: 'flex-end', flexWrap: 'wrap', gap: '10px' }}
      >
        <div
          className={`mp-items-count-box ${allowedAddonsCount === 0 ? 'is-limit' : ''}`}
          aria-label={`صلاحيتك بالإضافات ${addonsLimitText}`}
        >
          <span className="mp-items-count-label">صلاحيتك بالإضافات</span>
          <span className="mp-items-count-divider" aria-hidden="true" />
          <span dir="ltr" className="mp-items-count-num tabular-nums">
            {addonsLimitText}
          </span>
        </div>
      </motion.div>

      <div className="mp-addons-grid">
        {visibleAddons.map((addon, idx) => {
          const allowed = isAddonAllowedForPlan(addon.key, resolvedPlan);
          const reqLabel = getAddonRequiredPlanLabel(addon.key);
          const cfg = (addonsState[addon.key] || {}) as Record<string, any>;
          const isEnabled = allowed && Boolean(cfg.enabled);
          const isConfigured = Boolean(cfg.configured || cfg.enabled);
          const targetUpgradeTier = getAddonRequiredPlanTier(addon.key);

          return (
            <motion.div
              key={addon.key}
              className={`mp-addon-square-card ${isEnabled ? 'is-enabled' : ''} ${!allowed ? 'is-locked' : ''}`}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: allowed ? 1 : 0.72, y: 0 }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{
                duration: 0.82,
                delay: prefersReducedMotion ? 0 : Math.min((idx % 8) * 0.06, 0.38),
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={prefersReducedMotion ? undefined : { y: -2 }}
            >
              {/* Top Row: Icon + Status Pill */}
              <div className="mp-addon-card-head">
                <div className={`mp-addon-card-icon ${isEnabled ? 'is-enabled' : ''}`}>
                  <span>{addon.icon}</span>
                </div>
                <span
                  className={`mp-addon-status-pill ${
                    !allowed ? 'is-locked' : isEnabled ? 'is-enabled' : !isConfigured ? 'is-setup' : 'is-off'
                  }`}
                >
                  {!allowed
                    ? '🔒 مقفل'
                    : isEnabled
                    ? 'يعمل'
                    : !isConfigured
                    ? 'يتطلب إعداد'
                    : 'متوقف'}
                </span>
              </div>

              {/* Center: Title + Summary */}
              <div className="mp-addon-card-body">
                <b className="mp-addon-card-title">{addon.title}</b>
                <p className="mp-addon-card-desc">{addon.desc}</p>
                {addon.key === 'freeDeliveryProgress' && (
                  <div className="mp-addon-card-meta" style={{ color: isEnabled ? 'var(--brand)' : 'var(--muted)' }}>
                    الحد الأدنى: {formatNumber(Number(cfg.minAmount ?? 25000))} {currency}
                  </div>
                )}
              </div>

              {/* Bottom Action Row */}
              <div className="mp-addon-card-actions">
                {allowed ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleAddon(addon)}
                      className={`mp-addon-btn-toggle ${isEnabled ? 'is-stop' : 'is-start'}`}
                    >
                      <span className={`mp-addon-dot ${isEnabled ? 'is-on' : ''}`} />
                      <span>{isEnabled ? 'إيقاف' : 'تشغيل'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenAddonEdit(addon.key)}
                      className="mp-addon-btn-edit"
                    >
                      <Edit size={12} />
                      <span>تعديل</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => openUpgradeModal(targetUpgradeTier)}
                    className="mp-addon-btn-upgrade"
                  >
                    <span>🔒 {reqLabel}</span>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* FIXED CENTERED EDIT / SETUP ADDON POPUP MODAL */}
      {editingAddonKey && activeMeta && (
        <div className="mp-addon-modal-overlay" dir="rtl" onClick={closeEditModal}>
          <motion.div
            className="mp-addon-modal-card"
            onClick={(e) => e.stopPropagation()}
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={surfaceCardStyle}
          >
            <form onSubmit={handleSaveAddonEdit} className="mp-addon-modal-form" noValidate>
              {/* Sticky Header */}
              <div className="mp-addon-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div className="mp-addon-modal-icon">{activeMeta.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: 'var(--ink)' }}>
                      {addonEditIntent === 'enable' ? 'إعداد وتفعيل:' : 'تعديل:'} {activeMeta.title}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: 'var(--muted)' }}>
                      {activeMeta.desc}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeEditModal}
                  aria-label="إغلاق"
                  className="mp-addon-modal-close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="mp-addon-modal-body">
                {requiresInitialSetup ? (
                  <div className="mp-addon-setup-banner">
                    <Sparkles size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>
                      لتعمل هذه الإضافة بشكل صحيح في المنيو، راجع الحقول أدناه وعدّلها بما يناسبك ثم اضغط على{' '}
                      <b>"تفعيل الإضافة الآن"</b>.
                    </span>
                  </div>
                ) : (
                  <label className="mp-addon-enable-switch">
                    <div>
                      <span style={{ display: 'block', fontWeight: 800, fontSize: '13.5px', color: 'var(--ink)' }}>
                        حالة الميزة في المنيو
                      </span>
                      <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--muted)' }}>
                        {addonDraft.enabled ? 'مفعّلة وتظهر للزبائن الآن' : 'مضبوطة ولكن متوقفة مؤقتاً'}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(addonDraft.enabled)}
                      onChange={(e) => updateDraft((p) => ({ ...p, enabled: e.target.checked }))}
                    />
                  </label>
                )}

                {addonEditError && (
                  <div className="mp-addon-error-banner" role="alert">
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{addonEditError}</span>
                  </div>
                )}

                {editingAddonKey === 'offerPopup' && (
                  <>
                    <label className="f">
                      عنوان النافذة المنبثقة *
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                        required
                      />
                    </label>
                    <label className="f">
                      تفاصيل العرض
                      <textarea
                        rows={2}
                        value={addonDraft.subtitle || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, subtitle: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <div className="f">
                      <span>صورة العرض (رابط أو رفع من الجهاز)</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          dir="ltr"
                          value={addonDraft.image || ''}
                          onChange={(e) => updateDraft((p) => ({ ...p, image: e.target.value }))}
                          placeholder="https://..."
                          style={{ ...themedInputStyle, flex: 1 }}
                        />
                        <label
                          className="btn s"
                          style={{ cursor: 'pointer', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <Upload size={13} />
                          <span>رفع صورة</span>
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) =>
                              void handleDeviceImageUpload(
                                e,
                                (url) => updateDraft((p) => ({ ...p, image: url })),
                                'تم رفع صورة الإعلان',
                                'item'
                              )
                            }
                          />
                        </label>
                      </div>
                      {addonDraft.image && (
                        <div style={{ marginTop: '8px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--line)', height: '110px' }}>
                          <img
                            src={addonDraft.image}
                            alt="معاينة صورة البوب اب"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        </div>
                      )}
                    </div>
                    <label className="f">
                      نص الزر
                      <input
                        type="text"
                        value={addonDraft.buttonText || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, buttonText: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <button
                      type="button"
                      className="btn s"
                      onClick={() => setShowPopupPreview(true)}
                      style={{ marginBottom: '6px' }}
                    >
                      <Eye size={14} />
                      <span>معاينة شكل البوب اب للزبون</span>
                    </button>
                  </>
                )}

                {editingAddonKey === 'announcementBar' && (
                  <>
                    <div
                      style={{
                        borderRadius: '10px',
                        padding: '9px 12px',
                        marginBottom: '12px',
                        background: addonDraft.bgColor || '#C2410C',
                        color: addonDraft.textColor || '#ffffff',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        textAlign: 'center',
                      }}
                    >
                      {addonDraft.text || 'معاينة شريط الإعلانات أعلى المنيو'}
                    </div>
                    <label className="f">
                      نص الشريط الإعلاني *
                      <input
                        type="text"
                        value={addonDraft.text || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, text: e.target.value }))}
                        style={themedInputStyle}
                        required
                      />
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <label className="f">
                        لون خلفية الشريط
                        <input
                          type="color"
                          value={addonDraft.bgColor || '#C2410C'}
                          onChange={(e) => updateDraft((p) => ({ ...p, bgColor: e.target.value }))}
                          style={{ width: '100%', height: '40px', borderRadius: '8px', cursor: 'pointer' }}
                        />
                      </label>
                      <label className="f">
                        لون النص
                        <input
                          type="color"
                          value={addonDraft.textColor || '#ffffff'}
                          onChange={(e) => updateDraft((p) => ({ ...p, textColor: e.target.value }))}
                          style={{ width: '100%', height: '40px', borderRadius: '8px', cursor: 'pointer' }}
                        />
                      </label>
                    </div>
                  </>
                )}

                {editingAddonKey === 'countdownTimer' && (
                  <>
                    <label className="f">
                      عنوان العرض التنازلي
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <label className="f">
                        نوع الخصم الفعلي على المنيو
                        <select
                          value={addonDraft.discountType || 'percent'}
                          onChange={(e) => updateDraft((p) => ({ ...p, discountType: e.target.value }))}
                          style={themedInputStyle}
                        >
                          <option value="percent">نسبة مئوية (%)</option>
                          <option value="fixed">{`مبلغ ثابت (${currency})`}</option>
                        </select>
                      </label>
                      <label className="f">
                        قيمة الخصم (تخصم تلقائياً من الأسعار)
                        <input
                          type="number"
                          min={0}
                          value={addonDraft.discountValue ?? 15}
                          onChange={(e) =>
                            updateDraft((p) => ({
                              ...p,
                              discountValue: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)),
                            }))
                          }
                          style={themedInputStyle}
                        />
                      </label>
                    </div>
                    <label className="f">
                      نص التنبيه الظاهر في الشريط
                      <input
                        type="text"
                        value={addonDraft.discountText || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, discountText: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      ساعة انتهاء العرض اليومية
                      <select
                        value={Number(addonDraft.endHour ?? 23)}
                        onChange={(e) => updateDraft((p) => ({ ...p, endHour: Number(e.target.value) }))}
                        style={themedInputStyle}
                      >
                        {Array.from({ length: 24 }).map((_, hr) => (
                          <option key={hr} value={hr}>
                            {formatHourArabic(hr)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}

                {editingAddonKey === 'promoCoupons' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
                      <b style={{ fontSize: '13px', color: 'var(--ink)' }}>قائمة الكوبونات الفعالة (تظهر نهاية السلة)</b>
                      <button
                        type="button"
                        className="btn s"
                        onClick={() =>
                          updateDraft((p) => ({
                            ...p,
                            couponsList: [
                              ...(Array.isArray(p.couponsList) ? p.couponsList : []),
                              {
                                code: `SAVE${(p.couponsList?.length || 0) + 15}`,
                                discountType: 'percent',
                                discountValue: 15,
                                minSubtotal: 0,
                              },
                            ],
                          }))
                        }
                      >
                        <Plus size={14} />
                        <span>إضافة كوبون</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {(Array.isArray(addonDraft.couponsList) ? addonDraft.couponsList : []).map((cp: any, idx: number) => (
                        <div key={idx} style={{ background: 'color-mix(in srgb, var(--surface) 40%, transparent)', backdropFilter: 'blur(14px) saturate(1.25)', WebkitBackdropFilter: 'blur(14px) saturate(1.25)', border: '1px solid var(--line)', borderRadius: '12px', padding: '12px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                            <input
                              type="text"
                              dir="ltr"
                              placeholder="الكود (PLUS10)"
                              value={cp.code || ''}
                              onChange={(e) => {
                                const next = [...(addonDraft.couponsList || [])];
                                next[idx] = { ...next[idx], code: e.target.value.toUpperCase() };
                                updateDraft((p) => ({ ...p, couponsList: next }));
                              }}
                              style={{ ...themedInputStyle, fontWeight: 800 }}
                              required
                            />
                            <select
                              value={cp.discountType || 'percent'}
                              onChange={(e) => {
                                const next = [...(addonDraft.couponsList || [])];
                                next[idx] = { ...next[idx], discountType: e.target.value };
                                updateDraft((p) => ({ ...p, couponsList: next }));
                              }}
                              style={themedInputStyle}
                            >
                              <option value="percent">نسبة مئوية (%)</option>
                              <option value="fixed">{`مبلغ ثابت (${currency})`}</option>
                            </select>
                            {(addonDraft.couponsList?.length || 0) > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const next = (addonDraft.couponsList || []).filter((_: any, i: number) => i !== idx);
                                  updateDraft((p) => ({ ...p, couponsList: next }));
                                }}
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(239,68,68,0.3)',
                                  background: 'rgba(239,68,68,0.1)',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  display: 'grid',
                                  placeItems: 'center',
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <label className="f" style={{ margin: 0, fontSize: '12px' }}>
                              قيمة الخصم
                              <input
                                type="number"
                                min={1}
                                value={cp.discountValue ?? 10}
                                onChange={(e) => {
                                  const next = [...(addonDraft.couponsList || [])];
                                  next[idx] = { ...next[idx], discountValue: Number(e.target.value) };
                                  updateDraft((p) => ({ ...p, couponsList: next }));
                                }}
                                style={themedInputStyle}
                              />
                            </label>
                            <label className="f" style={{ margin: 0, fontSize: '12px' }}>
                              {`الحد الأدنى للطلب (${currency})`}
                              <input
                                type="number"
                                min={0}
                                value={cp.minSubtotal ?? 0}
                                onChange={(e) => {
                                  const next = [...(addonDraft.couponsList || [])];
                                  next[idx] = { ...next[idx], minSubtotal: Number(e.target.value) };
                                  updateDraft((p) => ({ ...p, couponsList: next }));
                                }}
                                style={themedInputStyle}
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {editingAddonKey === 'customerReviews' && (
                  <>
                    <label className="mp-addon-check-row">
                      <input
                        type="checkbox"
                        checked={addonDraft.showOnMenu !== false}
                        onChange={(e) => updateDraft((p) => ({ ...p, showOnMenu: e.target.checked }))}
                      />
                      <span>عرض تقييمات الزبائن في صفحة المنيو</span>
                    </label>
                    <label className="mp-addon-check-row">
                      <input
                        type="checkbox"
                        checked={addonDraft.allowSubmit !== false}
                        onChange={(e) => updateDraft((p) => ({ ...p, allowSubmit: e.target.checked }))}
                      />
                      <span>السماح للزبائن بإرسال تقييم جديد</span>
                    </label>
                  </>
                )}

                {editingAddonKey === 'minOrder' && (
                  <>
                    <label className="f">
                      {`الحد الأدنى لمبلغ الطلب (${currency}) *`}
                      <input
                        type="number"
                        min={1}
                        value={addonDraft.amount ?? 10000}
                        onChange={(e) => updateDraft((p) => ({ ...p, amount: Number(e.target.value) }))}
                        style={themedInputStyle}
                        required
                      />
                    </label>
                    <label className="f">
                      رسالة التنبيه للزبون
                      <input
                        type="text"
                        value={addonDraft.message || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, message: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'serviceFee' && (
                  <>
                    <label className="f">
                      تسمية الرسوم في الفاتورة *
                      <input
                        type="text"
                        value={addonDraft.label || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, label: e.target.value }))}
                        style={themedInputStyle}
                        required
                      />
                    </label>
                    <label className="f">
                      {`مبلغ الرسوم (${currency}) *`}
                      <input
                        type="number"
                        min={1}
                        value={addonDraft.amount ?? 1000}
                        onChange={(e) => updateDraft((p) => ({ ...p, amount: Number(e.target.value) }))}
                        style={themedInputStyle}
                        required
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'tableService' && (
                  <>
                    <label className="f">
                      عدد الطاولات المتوفرة في الصالة *
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={addonDraft.tablesCount ?? 12}
                        onChange={(e) => updateDraft((p) => ({ ...p, tablesCount: Number(e.target.value) }))}
                        style={themedInputStyle}
                        required
                      />
                    </label>
                    <label className="mp-addon-check-row">
                      <input
                        type="checkbox"
                        checked={addonDraft.allowWaiterCall !== false}
                        onChange={(e) => updateDraft((p) => ({ ...p, allowWaiterCall: e.target.checked }))}
                      />
                      <span>تفعيل زر نداء النادل للطاولة</span>
                    </label>
                  </>
                )}

                {editingAddonKey === 'healthNotices' && (
                  <label className="f">
                    العبارات الصحية والتغذوية (سطر لكل عبارة)
                    <textarea
                      rows={4}
                      value={addonDraft.noticesText || ''}
                      onChange={(e) => updateDraft((p) => ({ ...p, noticesText: e.target.value }))}
                      style={themedInputStyle}
                    />
                  </label>
                )}

                {editingAddonKey === 'audioBell' && (
                  <>
                    <label className="f">
                      نغمة التنبيه الصوتي للطلبات
                      <select
                        value={addonDraft.tone || 'bell'}
                        onChange={(e) => updateDraft((p) => ({ ...p, tone: e.target.value }))}
                        style={themedInputStyle}
                      >
                        <option value="bell">جرس الكاشير الكلاسيكي</option>
                        <option value="chime">رنين ناعم ثلاثي (Chime)</option>
                        <option value="alert">تنبيه سريع</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      className="btn s"
                      onClick={() => playBellTone(addonDraft.tone || 'bell')}
                      style={{ marginBottom: '6px' }}
                    >
                      <Volume2 size={15} />
                      <span>اختبار صوت التنبيه الآن</span>
                    </button>
                  </>
                )}

                {editingAddonKey === 'prepBadge' && (
                  <>
                    <label className="f">
                      عنوان الشارة (مثال: التحضير السريع)
                      <input
                        type="text"
                        value={addonDraft.text || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, text: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      الوقت المتوقع (مثال: 20 - 30 دقيقة)
                      <input
                        type="text"
                        value={addonDraft.etaText || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, etaText: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'closedNotice' && (
                  <>
                    <label className="f">
                      نص إشعار الطلب المسبق عند الإغلاق
                      <textarea
                        rows={3}
                        value={addonDraft.message || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, message: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                      يظهر هذا التنبيه تلقائياً للزبائن عندما يكون المتجر مغلقاً خارج أوقات الدوام أو مع تفعيل الطلب المسبق.
                    </div>
                  </>
                )}

                {editingAddonKey === 'happyHour' && (
                  <>
                    <label className="f">
                      عنوان عرض ساعة السعادة
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <label className="f">
                        من الساعة
                        <select
                          value={Number(addonDraft.startHour ?? 14)}
                          onChange={(e) => updateDraft((p) => ({ ...p, startHour: Number(e.target.value) }))}
                          style={themedInputStyle}
                        >
                          {Array.from({ length: 24 }).map((_, hr) => (
                            <option key={hr} value={hr}>
                              {formatHourArabic(hr)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="f">
                        إلى الساعة
                        <select
                          value={Number(addonDraft.endHour ?? 17)}
                          onChange={(e) => updateDraft((p) => ({ ...p, endHour: Number(e.target.value) }))}
                          style={themedInputStyle}
                        >
                          {Array.from({ length: 24 }).map((_, hr) => (
                            <option key={hr} value={hr}>
                              {formatHourArabic(hr)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className="f">
                      نسبة الخصم التلقائي (%)
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={addonDraft.discountPercent ?? 15}
                        onChange={(e) => updateDraft((p) => ({ ...p, discountPercent: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                    {(() => {
                      const s = Number(addonDraft.startHour ?? 14);
                      const en = Number(addonDraft.endHour ?? 17);
                      const activeNow = s <= en ? currentLocalHour >= s && currentLocalHour < en : currentLocalHour >= s || currentLocalHour < en;
                      return (
                        <div style={{ fontSize: '11.5px', fontWeight: 700, color: activeNow ? '#10b981' : 'var(--muted)' }}>
                          {activeNow
                            ? '✓ الوقت الحالي يقع ضمن ساعة السعادة وسيطبق الخصم فوراً عند التفعيل.'
                            : `الخصم سيتفعل تلقائياً يومياً من ${formatHourArabic(s)} إلى ${formatHourArabic(en)}.`}
                        </div>
                      );
                    })()}
                  </>
                )}

                {editingAddonKey === 'freeGiftThreshold' && (
                  <>
                    <label className="f">
                      {`الحد الأدنى للطلب للحصول على الهدية (${currency})`}
                      <input
                        type="number"
                        min={0}
                        value={addonDraft.minAmount ?? 25000}
                        onChange={(e) => updateDraft((p) => ({ ...p, minAmount: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      اسم الهدية المجانية *
                      <input
                        type="text"
                        value={addonDraft.giftName || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, giftName: e.target.value }))}
                        style={themedInputStyle}
                        required
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'cartUpsell' && (
                  <>
                    <label className="f">
                      عنوان قسم المقترحات في السلة
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      عدد الأصناف المقترحة داخل السلة (1 - 8)
                      <input
                        type="number"
                        min={1}
                        max={8}
                        value={addonDraft.maxItems ?? 4}
                        onChange={(e) => updateDraft((p) => ({ ...p, maxItems: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'dailySpecialBanner' && (
                  <>
                    <label className="f">
                      عنوان بطاقة طبق اليوم
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      الوصف المختصر
                      <input
                        type="text"
                        value={addonDraft.subtitle || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, subtitle: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      نص الشارة (مثال: الأكثر طلباً اليوم)
                      <input
                        type="text"
                        value={addonDraft.badgeText || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, badgeText: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      اختر الطبق المميز من المنيو
                      <select
                        value={addonDraft.itemId || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, itemId: e.target.value }))}
                        style={themedInputStyle}
                      >
                        <option value="">تلقائي (أول طبق متاح)</option>
                        {allItems.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.n} — {formatNumber(it.pr)} {currency}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}

                {editingAddonKey === 'spinWheelPromo' && (
                  <>
                    <label className="f">
                      عنوان نافذة عجلة الحظ
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      الجوائز المتاحة (سطر لكل جائزة — أمثلة: خصم 5%، خصم 10%، توصيل مجاني)
                      <textarea
                        rows={4}
                        value={addonDraft.prizesText || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, prizesText: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'loyaltyPoints' && (
                  <>
                    <label className="f">
                      {`عدد النقاط لكل 1,000 ${currency}`}
                      <input
                        type="number"
                        min={1}
                        value={addonDraft.pointsPerThousand ?? 1}
                        onChange={(e) => updateDraft((p) => ({ ...p, pointsPerThousand: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      رسالة تشجيع النقاط للزبون
                      <input
                        type="text"
                        value={addonDraft.rewardNote || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, rewardNote: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'socialProofBadge' && (
                  <>
                    <label className="f">
                      عدد المتصفحين الحاليين الظاهر
                      <input
                        type="number"
                        min={1}
                        value={addonDraft.visitorsCount ?? 18}
                        onChange={(e) => updateDraft((p) => ({ ...p, visitorsCount: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      نص عدد الطلبات اليومية
                      <input
                        type="text"
                        value={addonDraft.ordersTodayText || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, ordersTodayText: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'chefPicksFilter' && (
                  <>
                    <label className="mp-addon-check-row">
                      <input
                        type="checkbox"
                        checked={addonDraft.showPopular !== false}
                        onChange={(e) => updateDraft((p) => ({ ...p, showPopular: e.target.checked }))}
                      />
                      <span>تفعيل فلتر "الأكثر طلباً"</span>
                    </label>
                    <label className="mp-addon-check-row">
                      <input
                        type="checkbox"
                        checked={addonDraft.showOffers !== false}
                        onChange={(e) => updateDraft((p) => ({ ...p, showOffers: e.target.checked }))}
                      />
                      <span>تفعيل فلتر "العروض المخفضة"</span>
                    </label>
                  </>
                )}

                {editingAddonKey === 'quickReorder' && (
                  <label className="f">
                    نص زر إعادة الطلب السريع
                    <input
                      type="text"
                      value={addonDraft.buttonText || ''}
                      onChange={(e) => updateDraft((p) => ({ ...p, buttonText: e.target.value }))}
                      style={themedInputStyle}
                    />
                  </label>
                )}

                {editingAddonKey === 'savedFavorites' && (
                  <label className="f">
                    تسمية تبويب المفضلة
                    <input
                      type="text"
                      value={addonDraft.label || ''}
                      onChange={(e) => updateDraft((p) => ({ ...p, label: e.target.value }))}
                      style={themedInputStyle}
                    />
                  </label>
                )}

                {editingAddonKey === 'cutleryOption' && (
                  <label className="f">
                    نص سؤال أدوات الطعام داخل السلة
                    <input
                      type="text"
                      value={addonDraft.label || ''}
                      onChange={(e) => updateDraft((p) => ({ ...p, label: e.target.value }))}
                      style={themedInputStyle}
                    />
                  </label>
                )}

                {editingAddonKey === 'deliveryEtaTracker' && (
                  <label className="f">
                    وقت التوصيل المتوقع الظاهر للزبون
                    <input
                      type="text"
                      value={addonDraft.etaText || ''}
                      onChange={(e) => updateDraft((p) => ({ ...p, etaText: e.target.value }))}
                      style={themedInputStyle}
                    />
                  </label>
                )}

                {editingAddonKey === 'scheduledOrder' && (
                  <>
                    <label className="f">
                      عنوان اختيار الوقت
                      <input
                        type="text"
                        value={addonDraft.label || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, label: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      المواعيد المتاحة للجدولة (سطر لكل موعد)
                      <textarea
                        rows={4}
                        value={addonDraft.slotsText || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, slotsText: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'firstOrderDiscount' && (
                  <>
                    <label className="f">
                      نسبة خصم الطلب الأول (%)
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={addonDraft.discountPercent ?? 10}
                        onChange={(e) => updateDraft((p) => ({ ...p, discountPercent: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      عنوان الخصم الترحيبي
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'freeDeliveryProgress' && (
                  <>
                    <label className="f">
                      {`الحد الأدنى للتوصيل المجاني (${currency}) *`}
                      <input
                        type="number"
                        min={1}
                        value={addonDraft.minAmount ?? 25000}
                        onChange={(e) =>
                          updateDraft((p) => ({
                            ...p,
                            minAmount: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)),
                          }))
                        }
                        placeholder="25000"
                        style={themedInputStyle}
                        required
                      />
                    </label>
                    <label className="f">
                      عنوان شريط التوصيل المجاني التحفيزي
                      <input
                        type="text"
                        value={addonDraft.label || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, label: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'whatsappSupportFloat' && (
                  <>
                    <label className="f">
                      نص زر الدعم العائم
                      <input
                        type="text"
                        value={addonDraft.label || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, label: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      الرسالة التلقائية عند فتح الواتساب
                      <input
                        type="text"
                        value={addonDraft.prefillText || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, prefillText: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <div
                      style={{
                        padding: '9px 12px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: waTargetPhone ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.12)',
                        color: waTargetPhone ? '#10b981' : '#f59e0b',
                        border: waTargetPhone ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(245,158,11,0.3)',
                      }}
                    >
                      {waTargetPhone
                        ? `سيتم توجيه الزبون إلى رقم الواتساب: ${waTargetPhone}`
                        : 'تنبيه: يرجى التأكد من إضافة رقم واتساب المتجر في قسم "الإعدادات" ليظهر الزر للزبائن.'}
                    </div>
                  </>
                )}

                {editingAddonKey === 'groupOrderBillSplit' && (
                  <label className="f">
                    أقصى عدد للأشخاص في حاسبة تقسيم الفاتورة
                    <input
                      type="number"
                      min={2}
                      max={30}
                      value={addonDraft.maxPeople ?? 10}
                      onChange={(e) => updateDraft((p) => ({ ...p, maxPeople: Number(e.target.value) }))}
                      style={themedInputStyle}
                    />
                  </label>
                )}

                {editingAddonKey === 'flashTipOption' && (
                  <label className="f">
                    مبالغ الإكرامية السريعة (افصل بينها بفاصلة: 1000,2000,5000)
                    <input
                      type="text"
                      dir="ltr"
                      value={addonDraft.presetsText || ''}
                      onChange={(e) => updateDraft((p) => ({ ...p, presetsText: e.target.value }))}
                      style={{ ...themedInputStyle, textAlign: 'left' }}
                    />
                  </label>
                )}

                {editingAddonKey === 'mysteryBoxOffer' && (
                  <>
                    <label className="f">
                      اسم صندوق المفاجآت
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      وصف المحتويات والمفاجأة
                      <input
                        type="text"
                        value={addonDraft.subtitle || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, subtitle: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <div className="mp-grid-2">
                      <label className="f">
                        {`سعر الصندوق (${currency})`}
                        <input
                          type="number"
                          min={500}
                          value={addonDraft.price ?? 8000}
                          onChange={(e) => updateDraft((p) => ({ ...p, price: Number(e.target.value) }))}
                          style={themedInputStyle}
                        />
                      </label>
                      <label className="f">
                        القيمة الحقيقية قبل الخصم
                        <input
                          type="number"
                          min={500}
                          value={addonDraft.originalPrice ?? 16000}
                          onChange={(e) => updateDraft((p) => ({ ...p, originalPrice: Number(e.target.value) }))}
                          style={themedInputStyle}
                        />
                      </label>
                    </div>
                    <label className="f">
                      الكمية المتبقية المعروضة للزبائن
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={addonDraft.remainingCount ?? 5}
                        onChange={(e) => updateDraft((p) => ({ ...p, remainingCount: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'bogoDealEngine' && (
                  <>
                    <label className="f">
                      عنوان عرض القطعة الثانية
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      نسبة الخصم على القطعة الأقل سعراً (%)
                      <input
                        type="number"
                        min={5}
                        max={100}
                        value={addonDraft.secondItemDiscountPercent ?? 50}
                        onChange={(e) => updateDraft((p) => ({ ...p, secondItemDiscountPercent: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'vipSecretMenuLock' && (
                  <>
                    <label className="f">
                      الرمز السري لفتح الطبق المخفي
                      <input
                        type="text"
                        dir="ltr"
                        value={addonDraft.secretCode || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, secretCode: e.target.value }))}
                        style={{ ...themedInputStyle, textAlign: 'left' }}
                      />
                    </label>
                    <label className="f">
                      اسم الطبق السري الخاص بكبار الشخصيات
                      <input
                        type="text"
                        value={addonDraft.dishName || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, dishName: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      وصف الطبق السري
                      <input
                        type="text"
                        value={addonDraft.dishDesc || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, dishDesc: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {`سعر الطبق السري (${currency})`}
                      <input
                        type="number"
                        min={500}
                        value={addonDraft.dishPrice ?? 12000}
                        onChange={(e) => updateDraft((p) => ({ ...p, dishPrice: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'pickupInstantDiscount' && (
                  <>
                    <label className="f">
                      عنوان خصم الاستلام من المتجر
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      نسبة الخصم الفوري عند اختيار الاستلام (%)
                      <input
                        type="number"
                        min={2}
                        max={60}
                        value={addonDraft.discountPercent ?? 10}
                        onChange={(e) => updateDraft((p) => ({ ...p, discountPercent: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'birthdayVipTreat' && (
                  <>
                    <label className="f">
                      عنوان خيار عيد الميلاد في السلة
                      <input
                        type="text"
                        value={addonDraft.label || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, label: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      ملاحظة الهدية المجانية (حلى / شمعة / تهنئة)
                      <input
                        type="text"
                        value={addonDraft.freeTreatNote || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, freeTreatNote: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'buildYourOwnCombo' && (
                  <>
                    <label className="f">
                      عنوان عرض صمّم وجبتك
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <div className="mp-grid-2">
                      <label className="f">
                        أقل عدد أصناف في السلة
                        <input
                          type="number"
                          min={2}
                          max={10}
                          value={addonDraft.requiredCount ?? 3}
                          onChange={(e) => updateDraft((p) => ({ ...p, requiredCount: Number(e.target.value) }))}
                          style={themedInputStyle}
                        />
                      </label>
                      <label className="f">
                        نسبة خصم الكومبو (%)
                        <input
                          type="number"
                          min={2}
                          max={60}
                          value={addonDraft.discountPercent ?? 12}
                          onChange={(e) => updateDraft((p) => ({ ...p, discountPercent: Number(e.target.value) }))}
                          style={themedInputStyle}
                        />
                      </label>
                    </div>
                  </>
                )}

                {editingAddonKey === 'flashQuantityScarcity' && (
                  <div className="mp-grid-2">
                    <label className="f">
                      نص شارة الكمية المحدودة
                      <input
                        type="text"
                        value={addonDraft.badgePrefix || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, badgePrefix: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      الحد الأقصى للعدد المعروض
                      <input
                        type="number"
                        min={1}
                        max={25}
                        value={addonDraft.defaultRemaining ?? 4}
                        onChange={(e) => updateDraft((p) => ({ ...p, defaultRemaining: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </div>
                )}

                {editingAddonKey === 'streakRewardsCard' && (
                  <div className="mp-grid-2">
                    <label className="f">
                      عدد الطلبات لفتح المكافأة
                      <input
                        type="number"
                        min={2}
                        max={20}
                        value={addonDraft.targetOrders ?? 5}
                        onChange={(e) => updateDraft((p) => ({ ...p, targetOrders: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      المكافأة عند اكتمال السلسلة
                      <input
                        type="text"
                        value={addonDraft.rewardTitle || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, rewardTitle: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </div>
                )}

                {editingAddonKey === 'smartPairingSuggest' && (
                  <>
                    <label className="f">
                      عنوان قسم التكميل الذكي داخل نافذة الصنف
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      كلمة مفتاحية لقسم المشروبات أو الإضافات (مثال: مشروب)
                      <input
                        type="text"
                        value={addonDraft.categoryKeyword || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, categoryKeyword: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'luxuryGiftPackaging' && (
                  <div className="mp-grid-2">
                    <label className="f">
                      وصف خيار تغليف الهدايا الفاخر
                      <input
                        type="text"
                        value={addonDraft.label || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, label: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {`رسوم التغليف (${currency})`}
                      <input
                        type="number"
                        min={0}
                        value={addonDraft.feeAmount ?? 2000}
                        onChange={(e) => updateDraft((p) => ({ ...p, feeAmount: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </div>
                )}

                {editingAddonKey === 'moodMealFinder' && (
                  <div className="mp-grid-2">
                    <label className="f">
                      عنوان نافذة اختيار المزاج
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      نص زر مكتشف المزاج في المنيو
                      <input
                        type="text"
                        value={addonDraft.buttonText || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, buttonText: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </div>
                )}

                {editingAddonKey === 'voiceSearchOrder' && (
                  <>
                    <label className="f">
                      لغة التعرف الصوتي الافتراضية
                      <select
                        value={addonDraft.lang || 'ar-IQ'}
                        onChange={(e) => updateDraft((p) => ({ ...p, lang: e.target.value }))}
                        style={themedInputStyle}
                      >
                        <option value="ar-IQ">العربية - العراق (ar-IQ)</option>
                        <option value="ar-SA">العربية - الخليج والسعودية (ar-SA)</option>
                        <option value="en-US">الإنجليزية (en-US)</option>
                      </select>
                    </label>
                    <label className="f">
                      النص التوضيحي بجانب المايكروفون
                      <input
                        type="text"
                        value={addonDraft.hintText || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, hintText: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'dietaryAllergyRadar' && (
                  <label className="f">
                    رسالة التنبيه عند وجود مكونات حساسية في الصنف
                    <input
                      type="text"
                      value={addonDraft.warningText || ''}
                      onChange={(e) => updateDraft((p) => ({ ...p, warningText: e.target.value }))}
                      style={themedInputStyle}
                    />
                  </label>
                )}

                {editingAddonKey === 'calorieMacroBudget' && (
                  <label className="f">
                    حد السعرات الحرارية المستهدف للوجبة (kcal)
                    <input
                      type="number"
                      min={200}
                      max={4000}
                      value={addonDraft.targetCalories ?? 800}
                      onChange={(e) => updateDraft((p) => ({ ...p, targetCalories: Number(e.target.value) }))}
                      style={themedInputStyle}
                    />
                  </label>
                )}

                {editingAddonKey === 'multiCurrencySwitch' && (
                  <div className="mp-grid-2">
                    <label className="f">
                      رمز العملة البديلة (مثال: $)
                      <input
                        type="text"
                        dir="ltr"
                        value={addonDraft.altSymbol || '$'}
                        onChange={(e) => updateDraft((p) => ({ ...p, altSymbol: e.target.value }))}
                        style={{ ...themedInputStyle, textAlign: 'left' }}
                      />
                    </label>
                    <label className="f">
                      سعر الصرف (كم وحدة تساوي 1 عملة بديلة)
                      <input
                        type="number"
                        min={1}
                        step="any"
                        value={addonDraft.exchangeRate ?? 1500}
                        onChange={(e) => updateDraft((p) => ({ ...p, exchangeRate: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </div>
                )}

                {editingAddonKey === 'dishCompareDrawer' && (
                  <label className="f">
                    أقصى عدد أطباق للمقارنة في نفس الوقت
                    <input
                      type="number"
                      min={2}
                      max={4}
                      value={addonDraft.maxCompare ?? 2}
                      onChange={(e) => updateDraft((p) => ({ ...p, maxCompare: Number(e.target.value) }))}
                      style={themedInputStyle}
                    />
                  </label>
                )}

                {editingAddonKey === 'charityMealRoundup' && (
                  <div className="mp-grid-2">
                    <label className="f">
                      عنوان التبرع الخيري في السلة
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {`مبلغ المساهمة (${currency})`}
                      <input
                        type="number"
                        min={100}
                        value={addonDraft.donationAmount ?? 500}
                        onChange={(e) => updateDraft((p) => ({ ...p, donationAmount: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </div>
                )}

                {editingAddonKey === 'curbsidePickupCar' && (
                  <>
                    <label className="f">
                      تعليمات الاستلام من السيارة للزبون
                      <input
                        type="text"
                        value={addonDraft.instructions || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, instructions: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: 'var(--ink)' }}>
                      <input
                        type="checkbox"
                        checked={addonDraft.allowArrivedPing !== false}
                        onChange={(e) => updateDraft((p) => ({ ...p, allowArrivedPing: e.target.checked }))}
                      />
                      <span>تفعيل زر "وصلت أمام المطعم" لإرسال إشعار فوري عبر واتساب</span>
                    </label>
                  </>
                )}

                {editingAddonKey === 'liveKitchenLoad' && (
                  <>
                    <label className="f">
                      حالة ضغط المطبخ الحالية
                      <select
                        value={addonDraft.level || 'moderate'}
                        onChange={(e) => updateDraft((p) => ({ ...p, level: e.target.value }))}
                        style={themedInputStyle}
                      >
                        <option value="calm">هادئ (تجهيز سريع ⚡)</option>
                        <option value="moderate">متوسط (الوقت الاعتيادي ⏱️)</option>
                        <option value="busy">مزدحم (ضغط طلبات عالي 🔥)</option>
                      </select>
                    </label>
                    <label className="f">
                      ملاحظة إضافية تظهر بجانب الشارة
                      <input
                        type="text"
                        value={addonDraft.customNote || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, customNote: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'silentDropoffOption' && (
                  <label className="f">
                    نص خيار التوصيل الصامت بدون طرق الباب
                    <input
                      type="text"
                      value={addonDraft.label || ''}
                      onChange={(e) => updateDraft((p) => ({ ...p, label: e.target.value }))}
                      style={themedInputStyle}
                    />
                  </label>
                )}
              </div>

              {/* Sticky Footer */}
              <div className="mp-addon-modal-footer">
                {addonEditIntent === 'enable' ? (
                  <>
                    <button type="button" className="btn" onClick={closeEditModal} disabled={addonSaving}>
                      إلغاء
                    </button>
                    <button type="submit" className="btn p" disabled={addonSaving} style={{ fontWeight: 800 }}>
                      <CheckCircle2 size={15} />
                      <span>{addonSaving ? 'جاري التفعيل...' : 'تفعيل الإضافة الآن'}</span>
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn p" onClick={closeEditModal} style={{ fontWeight: 800 }}>
                    <CheckCircle2 size={15} />
                    <span>تم — إغلاق</span>
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* CENTERED OFFER POPUP PREVIEW */}
      {showPopupPreview && (
        <div
          className="mp-addon-modal-overlay"
          dir="rtl"
          style={{ zIndex: 100100 }}
          onClick={() => setShowPopupPreview(false)}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative',
              width: 'min(420px, 92vw)',
              ...surfaceCardStyle,
              borderRadius: '22px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.45)',
              textAlign: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => setShowPopupPreview(false)}
              aria-label="إغلاق"
              style={{
                position: 'absolute',
                top: '12px',
                insetInlineEnd: '12px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
                backdropFilter: 'blur(12px) saturate(1.2)',
                WebkitBackdropFilter: 'blur(12px) saturate(1.2)',
                border: '1px solid var(--line)',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--ink)',
                zIndex: 10,
              }}
            >
              ✕
            </button>

            {(addonDraft.image || addonsState.offerPopup?.image) && (
              <img
                src={addonDraft.image || addonsState.offerPopup?.image}
                alt="صورة الإعلان"
                style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
              />
            )}

            <div style={{ padding: '22px' }}>
              <h3 style={{ fontSize: '19px', fontWeight: 900, color: 'var(--ink)', margin: '0 0 8px' }}>
                {addonDraft.title || addonsState.offerPopup?.title}
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 20px' }}>
                {addonDraft.subtitle || addonsState.offerPopup?.subtitle}
              </p>
              <button
                type="button"
                onClick={() => setShowPopupPreview(false)}
                className="btn p b"
                style={{ fontWeight: 800 }}
              >
                {addonDraft.buttonText || addonsState.offerPopup?.buttonText || 'تصفح المنيو'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
