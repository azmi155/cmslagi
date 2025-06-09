import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Note } from '../types';
import { 
  Plus, 
  StickyNote, 
  Edit, 
  Trash2, 
  AlertCircle, 
  Clock,
  CheckCircle2 
} from 'lucide-react';

export function NotesWidget() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium',
    due_date: ''
  });

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes');
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingNote ? `/api/notes/${editingNote.id}` : '/api/notes';
      const method = editingNote ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchNotes();
        setShowForm(false);
        setEditingNote(null);
        setFormData({
          title: '',
          content: '',
          priority: 'medium',
          due_date: ''
        });
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      priority: note.priority,
      due_date: note.due_date ? note.due_date.split('T')[0] : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (noteId: number) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        const response = await fetch(`/api/notes/${noteId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await fetchNotes();
        }
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    }
  };

  const handleToggleComplete = async (noteId: number) => {
    try {
      const response = await fetch(`/api/notes/${noteId}/toggle`, {
        method: 'PATCH',
      });
      if (response.ok) {
        await fetchNotes();
      }
    } catch (error) {
      console.error('Failed to toggle note:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-3 w-3" />;
      case 'medium': return <Clock className="h-3 w-3" />;
      case 'low': return <CheckCircle2 className="h-3 w-3" />;
      default: return null;
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notes & Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <StickyNote className="h-5 w-5 mr-2" />
                Notes & Reminders
              </CardTitle>
              <CardDescription>
                Keep track of important tasks and reminders
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No notes yet. Click "Add Note" to create your first reminder.
              </div>
            ) : (
              notes.map((note) => (
                <div 
                  key={note.id} 
                  className={`border rounded-lg p-3 space-y-2 ${
                    note.completed ? 'opacity-60 bg-muted/30' : ''
                  } ${
                    !note.completed && isOverdue(note.due_date) ? 'border-red-300 bg-red-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1">
                      <Checkbox
                        checked={note.completed}
                        onCheckedChange={() => handleToggleComplete(note.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h4 className={`font-medium ${note.completed ? 'line-through' : ''}`}>
                          {note.title}
                        </h4>
                        <p className={`text-sm text-muted-foreground ${note.completed ? 'line-through' : ''}`}>
                          {note.content}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(note)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(note.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(note.priority)}`}
                    >
                      {getPriorityIcon(note.priority)}
                      <span className="ml-1">{note.priority}</span>
                    </Badge>
                    {note.due_date && (
                      <span className={`text-xs ${
                        isOverdue(note.due_date) && !note.completed ? 'text-red-600 font-medium' : 'text-muted-foreground'
                      }`}>
                        Due: {new Date(note.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Note Dialog */}
      {showForm && (
        <Dialog open={true} onOpenChange={() => {
          setShowForm(false);
          setEditingNote(null);
          setFormData({
            title: '',
            content: '',
            priority: 'medium',
            due_date: ''
          });
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingNote ? 'Edit Note' : 'Add New Note'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Note title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Note content"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date (Optional)</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingNote(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingNote ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
