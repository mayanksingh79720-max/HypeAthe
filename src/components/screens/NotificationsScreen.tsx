import React, { useState } from 'react';
import { ArrowLeft, CheckCheck, Heart, MessageSquare, UserPlus, Trophy, Bell } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NotificationItem } from '../../types';

export const NotificationsScreen: React.FC = () => {
  const {
    goBack,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    unreadNotificationsCount,
    navigateTo
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'kudos':
        return <Heart className="w-4 h-4 text-rose-500 fill-current" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-amber-500 fill-current" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-[var(--accent-orange)]" />;
      case 'challenge':
        return <Trophy className="w-4 h-4 text-[var(--accent-orange)]" />;
      default:
        return <Bell className="w-4 h-4 text-[var(--accent-orange)]" />;
    }
  };

  return (
    <div className="min-h-screen pb-32 pt-3 px-4 sm:px-6 md:px-8 w-full max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between py-2 mb-4">
        <button
          onClick={goBack}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--accent-orange)]/15 transition-colors cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h1 className="text-base md:text-lg font-black text-[var(--text-primary)]">
            Notifications
          </h1>
          {unreadNotificationsCount > 0 ? (
            <span className="text-[10px] font-bold text-[var(--accent-orange)]">
              {unreadNotificationsCount} Unread
            </span>
          ) : (
            <span className="text-[10px] font-bold text-[var(--text-secondary)]">
              All Caught Up
            </span>
          )}
        </div>

        {unreadNotificationsCount > 0 ? (
          <button
            onClick={markAllNotificationsRead}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-surface)] text-[var(--accent-orange)] hover:bg-[var(--accent-orange)]/15 transition-colors cursor-pointer"
            title="Mark all as read"
          >
            <CheckCheck className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </header>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 rounded-2xl bg-[var(--bg-secondary)] mb-5 border border-[var(--text-secondary)]/10 max-w-xs">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-[var(--accent-orange)] text-white shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            filter === 'unread'
              ? 'bg-[var(--accent-orange)] text-white shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Unread ({unreadNotificationsCount})
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[var(--bg-secondary)]/60 rounded-3xl border border-dashed border-[var(--text-secondary)]/20">
          <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface)] text-[var(--text-secondary)] flex items-center justify-center mx-auto mb-3">
            <Bell className="w-5 h-5 stroke-[1.8]" />
          </div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
            Stay active, share workouts in Community Feed, and connect with fellow athletes!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationRead(notif.id)}
              className={`p-4 rounded-3xl transition-all cursor-pointer border ${
                notif.read
                  ? 'bg-[var(--bg-secondary)] border-transparent opacity-80'
                  : 'bg-[var(--bg-secondary)] border-[var(--accent-orange)]/40 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar or Icon Badge */}
                <div className="w-10 h-10 rounded-2xl bg-[var(--bg-surface)] flex items-center justify-center shrink-0 shadow-inner">
                  {notif.avatar ? (
                    <span className="text-xs font-black text-[var(--text-primary)]">{notif.avatar}</span>
                  ) : (
                    getNotificationIcon(notif.type)
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {notif.title}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      {notif.timeAgo}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {notif.message}
                  </p>

                  {notif.actionText && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateTo('feed');
                      }}
                      className="mt-2 text-[11px] font-bold text-[var(--accent-orange)] hover:underline inline-flex items-center gap-1"
                    >
                      <span>{notif.actionText}</span>
                      <span>→</span>
                    </button>
                  )}
                </div>

                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-orange)] mt-1.5 shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
