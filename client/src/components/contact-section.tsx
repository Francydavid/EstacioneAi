import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, Phone, Mail, MapPin, Clock, Facebook, Twitter, Instagram, Linkedin, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { ContactFormData } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';

interface ContactSectionProps {
  onNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function ContactSection({ onNotification }: ContactSectionProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Contact form submission mutation
  const contactMutation = useMutation({
    mutationFn: (data: ContactFormData) => 
      apiRequest('POST', '/api/contact', data),
    onSuccess: () => {
      onNotification('Mensagem enviada com sucesso! Retornaremos em breve.', 'success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
      setPrivacyAccepted(false);
    },
    onError: () => {
      onNotification('Erro ao enviar mensagem. Tente novamente.', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message || !privacyAccepted) {
      onNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      onNotification('Por favor, insira um email válido.', 'error');
      return;
    }

    contactMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const faqItems = [
    {
      question: "Como faço para reservar uma vaga?",
      answer: "Você pode reservar uma vaga através do dashboard principal ou pela seção de reservas. Selecione o estacionamento, a data/hora desejada e confirme a reserva."
    },
    {
      question: "Posso cancelar uma reserva?",
      answer: "Sim, você pode cancelar reservas até 30 minutos antes do horário marcado sem custos adicionais. Após esse prazo, pode haver cobrança de taxa de cancelamento."
    },
    {
      question: "Como funciona o pagamento?",
      answer: "O sistema utiliza um saldo pré-pago. Você adiciona saldo à sua conta e o valor é debitado automaticamente quando utiliza as vagas."
    },
    {
      question: "O que fazer se a vaga estiver ocupada incorretamente?",
      answer: "Entre em contato conosco imediatamente através deste formulário ou pelo telefone de suporte. Nossa equipe resolverá a situação rapidamente."
    }
  ];

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Contato e Suporte</h2>
        <p className="text-muted-foreground">Entre em contato conosco para suporte ou sugestões</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Envie uma Mensagem</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact-name">Nome Completo</Label>
                    <Input
                      id="contact-name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Seu nome completo"
                      required
                      data-testid="input-contact-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      type="email"
                      id="contact-email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="seu@email.com"
                      required
                      data-testid="input-contact-email"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="contact-phone">Telefone (opcional)</Label>
                  <Input
                    type="tel"
                    id="contact-phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    data-testid="input-contact-phone"
                  />
                </div>
                
                <div>
                  <Label htmlFor="contact-subject">Assunto</Label>
                  <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                    <SelectTrigger data-testid="select-contact-subject">
                      <SelectValue placeholder="Selecione um assunto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="suporte">Suporte Técnico</SelectItem>
                      <SelectItem value="duvida">Dúvida sobre o Sistema</SelectItem>
                      <SelectItem value="sugestao">Sugestão de Melhoria</SelectItem>
                      <SelectItem value="problema">Reportar Problema</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="contact-message">Mensagem</Label>
                  <Textarea
                    id="contact-message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    rows={5}
                    placeholder="Descreva sua mensagem ou problema detalhadamente..."
                    className="resize-none"
                    required
                    data-testid="textarea-contact-message"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="contact-privacy"
                    checked={privacyAccepted}
                    onCheckedChange={setPrivacyAccepted}
                    required
                    data-testid="checkbox-contact-privacy"
                  />
                  <Label htmlFor="contact-privacy" className="text-sm text-muted-foreground">
                    Concordo com os <button type="button" className="text-primary hover:underline">termos de privacidade</button>
                  </Label>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={contactMutation.isPending}
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {contactMutation.isPending ? 'Enviando...' : 'Enviar Mensagem'}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle>Perguntas Frequentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqItems.map((item, index) => (
                <Collapsible key={index}>
                  <CollapsibleTrigger 
                    className="flex items-center justify-between w-full text-left text-sm font-medium text-foreground hover:text-primary p-2 rounded hover:bg-muted"
                    data-testid={`faq-trigger-${index}`}
                  >
                    {item.question}
                    <ChevronDown className="w-4 h-4 transform transition-transform group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 text-sm text-muted-foreground p-2">
                    {item.answer}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Telefone</p>
                  <p className="text-sm text-muted-foreground">(11) 3000-0000</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Email</p>
                  <p className="text-sm text-muted-foreground">suporte@estacioneai.com.br</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Endereço</p>
                  <p className="text-sm text-muted-foreground">
                    Av. Paulista, 1000<br />São Paulo - SP
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Horário de Atendimento</p>
                  <p className="text-sm text-muted-foreground">
                    Segunda a Sexta: 8h às 18h<br />Sábado: 8h às 12h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle>Redes Sociais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <a 
                  href="#" 
                  className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                  data-testid="link-facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 bg-blue-400 rounded-lg flex items-center justify-center text-white hover:bg-blue-500 transition-colors"
                  data-testid="link-twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center text-white hover:bg-pink-700 transition-colors"
                  data-testid="link-instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white hover:bg-blue-800 transition-colors"
                  data-testid="link-linkedin"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </CardContent>
          </Card>
          
          {/* Emergency Contact */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-red-900">Emergência</h3>
            </div>
            <p className="text-sm text-red-800 mb-3">Para situações de emergência ou problemas urgentes:</p>
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-900">📞 (11) 99999-9999</p>
              <p className="text-sm font-medium text-red-900">📧 emergencia@estacioneai.com.br</p>
            </div>
            <p className="text-xs text-red-700 mt-2">Disponível 24 horas por dia, 7 dias por semana</p>
          </div>
        </div>
      </div>
    </div>
  );
}
