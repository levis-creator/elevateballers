import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function UITest() {
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [selectValue, setSelectValue] = useState('');

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-heading font-semibold mb-2">shadcn/ui Components Test</h1>
        <p className="text-muted-foreground">
          This page tests all core shadcn/ui components to ensure they work correctly with the admin portal design system.
        </p>
      </div>

      {/* Buttons Section */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>Test all button variants and sizes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Default Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="destructive">Destructive Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="link">Link Button</Button>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">
              <CheckCircle />
            </Button>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button disabled>Disabled</Button>
            <Button variant="default" disabled>Disabled Default</Button>
          </div>
        </CardContent>
      </Card>

      {/* Form Inputs Section */}
      <Card>
        <CardHeader>
          <CardTitle>Form Inputs</CardTitle>
          <CardDescription>Test input, textarea, label, and select components</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="test-input">Text Input</Label>
            <Input
              id="test-input"
              placeholder="Enter text here..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Value: {inputValue || '(empty)'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-textarea">Textarea</Label>
            <Textarea
              id="test-textarea"
              placeholder="Enter multiple lines here..."
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value)}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Value: {textareaValue || '(empty)'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-select">Select</Label>
            <Select value={selectValue} onValueChange={setSelectValue}>
              <SelectTrigger id="test-select">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
                <SelectItem value="option3">Option 3</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Selected: {selectValue || '(none)'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="disabled-input">Disabled Input</Label>
            <Input id="disabled-input" placeholder="Disabled input" disabled />
          </div>
        </CardContent>
      </Card>

      {/* Cards Section */}
      <Card>
        <CardHeader>
          <CardTitle>Card Components</CardTitle>
          <CardDescription>Test card structure and variants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description text</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is the card content area.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Another Card</CardTitle>
                <CardDescription>With different content</CardDescription>
              </CardHeader>
              <CardContent>
                <p>More card content here.</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Color Verification Section */}
      <Card>
        <CardHeader>
          <CardTitle>Color Verification</CardTitle>
          <CardDescription>Verify that colors match the admin design system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-md bg-primary"></div>
            <div>
              <p className="font-semibold">Primary Color</p>
              <p className="text-sm text-muted-foreground">Should be #dd3333 (red)</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-md bg-destructive"></div>
            <div>
              <p className="font-semibold">Destructive Color</p>
              <p className="text-sm text-muted-foreground">Should be #ef4444 (error red)</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-md bg-secondary"></div>
            <div>
              <p className="font-semibold">Secondary Color</p>
              <p className="text-sm text-muted-foreground">Should be #f3f4f6 (gray-100)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Font Verification Section */}
      <Card>
        <CardHeader>
          <CardTitle>Font Verification</CardTitle>
          <CardDescription>Verify that fonts match the admin design system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h2 className="text-2xl font-heading font-semibold mb-2">Heading Font (Teko)</h2>
            <p className="text-sm text-muted-foreground">This heading should use Teko font</p>
          </div>
          <div>
            <p className="font-sans mb-2">Body Font (Rubik)</p>
            <p className="text-sm text-muted-foreground font-sans">
              This paragraph should use Rubik font for body text.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status Icons */}
      <Card>
        <CardHeader>
          <CardTitle>Status Indicators</CardTitle>
          <CardDescription>Test icons and status displays</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle className="w-5 h-5" />
              <span>Success</span>
            </div>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span>Error</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Info className="w-5 h-5" />
              <span>Info</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

