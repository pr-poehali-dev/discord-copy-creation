import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';

const API_URLS = {
  auth: 'https://functions.poehali.dev/3e44251f-4b4d-4b14-835e-1a64b73d6f50',
  messages: 'https://functions.poehali.dev/94d25c78-0d81-4778-be0d-be15b72364a8',
  servers: 'https://functions.poehali.dev/d66d043c-8989-477c-bff6-80b2774216ba',
};

interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  status?: string;
}

interface Channel {
  id: number;
  name: string;
  type: string;
}

interface Server {
  id: number;
  name: string;
  icon_url: string;
  channels: Channel[];
}

interface Message {
  id: number;
  content: string;
  created_at: string;
  user_id: number;
  username: string;
  avatar_url?: string;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState<'login' | 'register' | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const [authForm, setAuthForm] = useState({
    username: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('discord_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      setShowAuth('login');
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadServers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChannel) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChannel]);

  const loadServers = async () => {
    try {
      const response = await fetch(`${API_URLS.servers}?user_id=${user?.id}`);
      const data = await response.json();
      setServers(data.servers || []);
      if (data.servers && data.servers.length > 0) {
        setSelectedServer(data.servers[0]);
        if (data.servers[0].channels && data.servers[0].channels.length > 0) {
          setSelectedChannel(data.servers[0].channels[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load servers:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedChannel) return;
    try {
      const response = await fetch(
        `${API_URLS.messages}?channel_id=${selectedChannel.id}`
      );
      const data = await response.json();
      setMessages((data.messages || []).reverse());
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleAuth = async (action: 'login' | 'register') => {
    try {
      const response = await fetch(API_URLS.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...authForm }),
      });
      const data = await response.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('discord_user', JSON.stringify(data.user));
        setShowAuth(null);
      }
    } catch (error) {
      console.error('Auth failed:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel || !user) return;

    try {
      await fetch(API_URLS.messages, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: selectedChannel.id,
          user_id: user.id,
          content: newMessage,
        }),
      });
      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (showAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-primary">
              {showAuth === 'login' ? 'С возвращением!' : 'Создать аккаунт'}
            </h1>
            <p className="text-muted-foreground">
              {showAuth === 'login'
                ? 'Рады снова тебя видеть!'
                : 'Присоединяйся к нашему сообществу'}
            </p>
          </div>

          <div className="space-y-4">
            {showAuth === 'register' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Имя пользователя
                </label>
                <Input
                  placeholder="astronaut"
                  value={authForm.username}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, username: e.target.value })
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Электронная почта
              </label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={authForm.email}
                onChange={(e) =>
                  setAuthForm({ ...authForm, email: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Пароль
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={authForm.password}
                onChange={(e) =>
                  setAuthForm({ ...authForm, password: e.target.value })
                }
              />
            </div>

            <Button
              className="w-full"
              onClick={() => handleAuth(showAuth)}
            >
              {showAuth === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </Button>

            <div className="text-center text-sm">
              <button
                className="text-primary hover:underline"
                onClick={() =>
                  setShowAuth(showAuth === 'login' ? 'register' : 'login')
                }
              >
                {showAuth === 'login'
                  ? 'Нужен аккаунт? Зарегистрируйтесь'
                  : 'Уже есть аккаунт? Войдите'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      <div className="w-20 bg-sidebar flex flex-col items-center py-4 space-y-3">
        {servers.map((server) => (
          <button
            key={server.id}
            onClick={() => {
              setSelectedServer(server);
              if (server.channels && server.channels.length > 0) {
                setSelectedChannel(server.channels[0]);
              }
            }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all hover:rounded-xl ${
              selectedServer?.id === server.id
                ? 'bg-primary text-primary-foreground rounded-xl'
                : 'bg-sidebar-accent hover:bg-primary hover:text-primary-foreground'
            }`}
          >
            {server.icon_url}
          </button>
        ))}
        <button className="w-12 h-12 rounded-full bg-sidebar-accent hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all">
          <Icon name="Plus" size={24} />
        </button>
      </div>

      <div className="w-60 bg-card flex flex-col">
        <div className="h-12 border-b border-border flex items-center px-4 font-semibold">
          {selectedServer?.name}
        </div>
        <ScrollArea className="flex-1 px-2">
          <div className="py-2 space-y-1">
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
              ТЕКСТОВЫЕ КАНАЛЫ
            </div>
            {selectedServer?.channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-sidebar-accent transition-colors ${
                  selectedChannel?.id === channel.id
                    ? 'bg-sidebar-accent text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                <Icon name="Hash" size={20} />
                <span className="text-sm">{channel.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="h-14 border-t border-border flex items-center px-2 gap-2">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.username}</div>
            <div className="text-xs text-muted-foreground">онлайн</div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setUser(null);
              localStorage.removeItem('discord_user');
              setShowAuth('login');
            }}
          >
            <Icon name="LogOut" size={18} />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-12 border-b border-border flex items-center px-4 gap-2">
          <Icon name="Hash" size={20} className="text-muted-foreground" />
          <span className="font-semibold">{selectedChannel?.name}</span>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <Icon name="MessageSquare" size={48} className="mx-auto mb-2 opacity-50" />
                <p>Пока нет сообщений в этом канале</p>
              </div>
            )}
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3 hover:bg-muted/50 px-3 py-2 rounded">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {message.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-sm">{message.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4">
          <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2">
            <Input
              placeholder={`Написать в #${selectedChannel?.name}`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="border-0 bg-transparent focus-visible:ring-0"
            />
            <Button size="icon" variant="ghost" onClick={sendMessage}>
              <Icon name="Send" size={20} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;